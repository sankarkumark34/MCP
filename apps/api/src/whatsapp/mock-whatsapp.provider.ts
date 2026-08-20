import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { WhatsAppGroup } from '../entities/whatsapp-group.entity';
import {
  ProviderError,
  ProviderGroup,
  SendResult,
  WhatsAppProvider,
} from './whatsapp-provider.interface';

/**
 * Development/demo provider. Simulates delivery latency and a configurable
 * transient failure rate so retry behavior can be exercised end to end.
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
  ) {
    this.failureRate = Math.min(
      1,
      Math.max(0, Number(config.get('MOCK_FAILURE_RATE', 0.1))),
    );
  }

  async listGroups(): Promise<ProviderGroup[]> {
    const rows = await this.groups.find({ order: { name: 'ASC' } });
    return rows.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      memberCount: g.memberCount,
      supported: g.supported,
    }));
  }

  async sendGroupMessage(groupId: string, message: string): Promise<SendResult> {
    const group = await this.groups.findOne({ where: { id: groupId } });
    if (!group) {
      throw new ProviderError(`Group ${groupId} not found`, 'GROUP_NOT_FOUND', false);
    }
    if (!group.supported) {
      throw new ProviderError(
        `Group "${group.name}" does not support automated messaging with this provider`,
        'GROUP_UNSUPPORTED',
        false,
      );
    }
    // Simulated network latency
    await new Promise((r) => setTimeout(r, 100 + Math.random() * 300));
    if (Math.random() < this.failureRate) {
      throw new ProviderError(
        'Simulated transient provider outage',
        'PROVIDER_UNAVAILABLE',
        true,
      );
    }
    const providerMessageId = `mock-${randomUUID()}`;
    this.logger.log(
      `Delivered message to "${group.name}" (${message.length} chars) → ${providerMessageId}`,
    );
    return { providerMessageId };
  }

  async getStatus() {
    return {
      connected: true,
      provider: this.name,
      groupMessagingSupported: true,
      detail:
        'Mock provider active — simulates delivery with configurable transient failures. Replace with a verified WhatsApp provider adapter before production.',
    };
  }
}
