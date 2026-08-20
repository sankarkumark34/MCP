export interface ProviderGroup {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  supported: boolean;
}

export interface SendResult {
  providerMessageId: string;
  /** how many individual recipients were delivered to */
  delivered: number;
  /** phone numbers that could not be delivered to in this attempt */
  failedNumbers: string[];
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    /** transient errors are retried; permanent errors fail immediately */
    public readonly transient: boolean,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

/**
 * Replaceable WhatsApp provider adapter.
 *
 * Delivery model: individual messages fanned out to every contact of a
 * recipient list IN PARALLEL — the officially supported way to notify many
 * people at the same time (WhatsApp group-send APIs are not generally
 * available). Keep provider-specific behavior inside implementations of this
 * interface only.
 */
export interface WhatsAppProvider {
  readonly name: string;
  listGroups(): Promise<ProviderGroup[]>;
  /** Send `message` to every contact in the recipient list, concurrently. */
  sendGroupMessage(listId: string, message: string): Promise<SendResult>;
  getStatus(): Promise<{
    connected: boolean;
    provider: string;
    groupMessagingSupported: boolean;
    detail: string;
  }>;
}

export const WHATSAPP_PROVIDER = Symbol('WHATSAPP_PROVIDER');
