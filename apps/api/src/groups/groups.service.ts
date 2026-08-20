import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  WHATSAPP_PROVIDER,
  WhatsAppProvider,
  ProviderGroup,
} from '../whatsapp/whatsapp-provider.interface';

@Injectable()
export class GroupsService {
  constructor(
    @Inject(WHATSAPP_PROVIDER) private readonly provider: WhatsAppProvider,
  ) {}

  listGroups(): Promise<ProviderGroup[]> {
    return this.provider.listGroups();
  }

  async getGroup(id: string): Promise<ProviderGroup> {
    const group = (await this.provider.listGroups()).find((g) => g.id === id);
    if (!group) throw new NotFoundException(`Group ${id} not found`);
    return group;
  }
}
