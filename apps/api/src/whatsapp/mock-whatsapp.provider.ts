import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { WhatsAppGroup } from '../entities/whatsapp-group.entity';
import { Contact } from '../entities/contact.entity';
import {
  ProviderError,
  ProviderGroup,
  SendResult,
  WhatsAppProvider,
} from './whatsapp-provider.interface';

/**
 * Development/demo provider. Fans out individual sends to every contact of a
 * recipient list in parallel, simulating latency and a configurable transient
 * per-recipient failure rate so retry behavior can be exercised end to end.
 */
@Injectable()
export class MockWhatsAppProvider implements WhatsAppProvider {
  readonly name = 'mock';
  private readonly logger = new Logger(MockWhatsAppProvider.name);
  private readonly failureRate: number;

  constructor(
    config: ConfigService,
    @InjectRepository(WhatsAppGroup)
    private readonly groups: Repository<WhatsAppGroup>,
    @InjectRepository(Contact)
    private readonly contacts: Repository<Contact>,
  ) {
    this.failureRate = Math.min(
      1,
      Math.max(0, Number(config.get('MOCK_FAILURE_RATE', 0.1))),
    );
  }

  async listGroups(): Promise<ProviderGroup[]> {
    const rows = await this.groups.find({ order: { name: 'ASC' } });
    const groups: ProviderGroup[] = [];
    for (const g of rows) {
      groups.push({
        id: g.id,
        name: g.name,
        description: g.description,
        memberCount: await this.contacts.count({ where: { listId: g.id } }),
        supported: g.supported,
      });
    }
    return groups;
  }

  async sendGroupMessage(listId: string, message: string): Promise<SendResult> {
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

    // Fan out to every recipient IN PARALLEL — all deliveries happen at the
    // same time, mirroring how a real provider adapter would batch sends.
    const results = await Promise.allSettled(
      recipients.map((r) => this.sendToNumber(r.phone, message)),
    );
    const failedNumbers = recipients
      .filter((_, i) => results[i].status === 'rejected')
      .map((r) => r.phone);
    const delivered = recipients.length - failedNumbers.length;

    this.logger.log(
      `List "${list.name}": delivered ${delivered}/${recipients.length} individual messages (${message.length} chars)`,
    );

    if (failedNumbers.length > 0) {
      throw new ProviderError(
        `Delivered ${delivered}/${recipients.length}; transient failures for: ${failedNumbers.join(', ')}`,
        'PARTIAL_DELIVERY',
        true,
      );
    }
    return {
      providerMessageId: `mock-batch-${randomUUID()}`,
      delivered,
      failedNumbers: [],
    };
  }

  private async sendToNumber(phone: string, _message: string): Promise<void> {
    // Simulated per-recipient network latency
    await new Promise((r) => setTimeout(r, 80 + Math.random() * 250));
    if (Math.random() < this.failureRate) {
      throw new ProviderError(
        `Simulated transient failure sending to ${phone}`,
        'RECIPIENT_UNREACHABLE',
        true,
      );
    }
  }

  async getStatus() {
    return {
      connected: true,
      provider: this.name,
      groupMessagingSupported: true,
      detail:
        'Mock provider active — fans out individual messages to every contact in a recipient list in parallel, with simulated transient failures. Replace with a verified WhatsApp provider adapter (e.g. Meta Cloud API) before production.',
    };
  }
}
