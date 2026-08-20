import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Client, LocalAuth } from 'whatsapp-web.js';
import * as QRCode from 'qrcode';
import { WhatsAppGroup } from '../entities/whatsapp-group.entity';
import { Contact } from '../entities/contact.entity';
import {
  ProviderError,
  ProviderGroup,
  SendResult,
  WhatsAppProvider,
} from './whatsapp-provider.interface';

/**
 * Real WhatsApp delivery via whatsapp-web.js: links the user's own WhatsApp
 * account as a "linked device" (one-time QR scan, like WhatsApp Web) and
 * fans out individual messages to every contact of a recipient list in
 * parallel.
 *
 * NOTE: whatsapp-web.js is an unofficial library and is against WhatsApp's
 * Terms of Service — there is a real (if small) risk of the linked number
 * being banned, especially for spammy volume. Keep lists small, messages
 * personal, and switch WHATSAPP_PROVIDER=mock any time.
 */
@Injectable()
export class WWebJsProvider
  implements WhatsAppProvider, OnModuleInit, OnApplicationShutdown
{
  readonly name = 'whatsapp-web';
  private readonly logger = new Logger(WWebJsProvider.name);
  private readonly enabled: boolean;
  private client: Client | null = null;
  private ready = false;
  private lastQr: string | null = null;
  private lastError: string | null = null;
  private selfNumber: string | null = null;

  private readonly chromePath: string | undefined;

  constructor(
    config: ConfigService,
    @InjectRepository(WhatsAppGroup)
    private readonly groups: Repository<WhatsAppGroup>,
    @InjectRepository(Contact)
    private readonly contacts: Repository<Contact>,
  ) {
    this.enabled = config.get<string>('WHATSAPP_PROVIDER') === 'whatsapp-web';
    this.chromePath = config.get<string>('CHROME_PATH') || undefined;
  }

  onModuleInit(): void {
    if (!this.enabled) return;
    this.logger.log('Starting whatsapp-web.js client (headless browser)…');
    this.client = new Client({
      authStrategy: new LocalAuth({ dataPath: 'data/wweb-session' }),
      puppeteer: {
        headless: true,
        // Use an installed Chrome when provided (avoids the puppeteer
        // Chromium download); otherwise puppeteer's bundled browser.
        executablePath: this.chromePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
      },
    });

    this.client.on('qr', (qr) => {
      this.lastQr = qr;
      this.ready = false;
      this.logger.log(
        'QR code generated — open Settings in the console (or WhatsApp > Linked devices) and scan it.',
      );
    });
    this.client.on('ready', () => {
      this.ready = true;
      this.lastQr = null;
      this.lastError = null;
      this.selfNumber = this.client?.info?.wid?.user ?? null;
      this.logger.log(
        `WhatsApp linked and ready${this.selfNumber ? ` as +${this.selfNumber}` : ''}`,
      );
    });
    this.client.on('auth_failure', (msg) => {
      this.lastError = `Authentication failed: ${msg}`;
      this.logger.error(this.lastError);
    });
    this.client.on('disconnected', (reason) => {
      this.ready = false;
      this.lastError = `Disconnected: ${reason}`;
      this.logger.warn(this.lastError);
    });

    this.client.initialize().catch((err: Error) => {
      this.lastError = `Client failed to start: ${err.message}`;
      this.logger.error(this.lastError);
    });
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.client) {
      await this.client.destroy().catch(() => undefined);
    }
  }

  async listGroups(): Promise<ProviderGroup[]> {
    const rows = await this.groups.find({ order: { name: 'ASC' } });
    const result: ProviderGroup[] = [];
    for (const g of rows) {
      result.push({
        id: g.id,
        name: g.name,
        description: g.description,
        memberCount: await this.contacts.count({ where: { listId: g.id } }),
        supported: g.supported,
      });
    }
    return result;
  }

  async sendGroupMessage(listId: string, message: string): Promise<SendResult> {
    if (!this.client || !this.ready) {
      throw new ProviderError(
        this.lastQr
          ? 'WhatsApp is not linked yet — scan the QR code on the Settings page'
          : this.lastError ?? 'WhatsApp client is still starting, try again shortly',
        'NOT_CONNECTED',
        true,
      );
    }
    const list = await this.groups.findOne({ where: { id: listId } });
    if (!list) {
      throw new ProviderError(`Recipient list ${listId} not found`, 'LIST_NOT_FOUND', false);
    }
    if (!list.supported) {
      throw new ProviderError(
        `Recipient list "${list.name}" is not enabled for automated messaging`,
        'LIST_UNSUPPORTED',
        false,
      );
    }
    const recipients = await this.contacts.find({ where: { listId } });
    if (recipients.length === 0) {
      throw new ProviderError(
        `Recipient list "${list.name}" has no contacts — add phone numbers first`,
        'LIST_EMPTY',
        false,
      );
    }

    // Fan out to every recipient in parallel.
    const results = await Promise.allSettled(
      recipients.map((r) => this.sendToNumber(r.phone, message)),
    );
    const failed: { phone: string; reason: string }[] = [];
    results.forEach((res, i) => {
      if (res.status === 'rejected') {
        failed.push({
          phone: recipients[i].phone,
          reason:
            res.reason instanceof Error ? res.reason.message : String(res.reason),
        });
      }
    });
    const delivered = recipients.length - failed.length;
    this.logger.log(
      `List "${list.name}": delivered ${delivered}/${recipients.length} real WhatsApp messages`,
    );

    if (failed.length > 0) {
      const detail = failed
        .map((f) => `${f.phone} (${f.reason})`)
        .join('; ');
      throw new ProviderError(
        `Delivered ${delivered}/${recipients.length}; failed: ${detail}`,
        'PARTIAL_DELIVERY',
        true,
      );
    }
    return {
      providerMessageId: `wweb-batch-${randomUUID()}`,
      delivered,
      failedNumbers: [],
    };
  }

  private async sendToNumber(phone: string, message: string): Promise<void> {
    const digits = phone.replace(/\D/g, '');
    const numberId = await this.client!.getNumberId(digits);
    if (!numberId) {
      throw new Error(`${phone} is not registered on WhatsApp`);
    }
    await this.client!.sendMessage(numberId._serialized, message);
  }

  /** Data-URL PNG of the pairing QR, or null when linked / not yet generated. */
  async getQr(): Promise<string | null> {
    if (!this.lastQr) return null;
    return QRCode.toDataURL(this.lastQr, { margin: 1, width: 280 });
  }

  async getStatus() {
    const detail = this.ready
      ? `Linked to WhatsApp${this.selfNumber ? ` account +${this.selfNumber}` : ''} — messages are delivered for real. Unofficial linked-device integration: keep volume modest to avoid spam detection.`
      : this.lastQr
        ? 'Waiting for QR scan — open WhatsApp on your phone > Linked devices > Link a device, and scan the QR shown on the Settings page.'
        : this.lastError ?? 'Client is starting up…';
    return {
      connected: this.ready,
      provider: this.name,
      groupMessagingSupported: true,
      detail,
    };
  }
}
