export interface ProviderGroup {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  supported: boolean;
}

export interface SendResult {
  providerMessageId: string;
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
 * IMPORTANT: do not assume arbitrary group messaging is supported by a real
 * provider — verify the exact provider/account capability before production
 * use, and keep provider-specific behavior inside implementations of this
 * interface only.
 */
export interface WhatsAppProvider {
  readonly name: string;
  listGroups(): Promise<ProviderGroup[]>;
  sendGroupMessage(groupId: string, message: string): Promise<SendResult>;
  getStatus(): Promise<{
    connected: boolean;
    provider: string;
    groupMessagingSupported: boolean;
    detail: string;
  }>;
}

export const WHATSAPP_PROVIDER = Symbol('WHATSAPP_PROVIDER');
