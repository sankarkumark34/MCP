import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { WhatsAppGroup } from '../entities/whatsapp-group.entity';
import { Contact } from '../entities/contact.entity';
import {
  WHATSAPP_PROVIDER,
  WhatsAppProvider,
  ProviderGroup,
} from '../whatsapp/whatsapp-provider.interface';

const E164 = /^\+[1-9]\d{6,14}$/;

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(
    @Inject(WHATSAPP_PROVIDER) private readonly provider: WhatsAppProvider,
    @InjectRepository(WhatsAppGroup)
    private readonly lists: Repository<WhatsAppGroup>,
    @InjectRepository(Contact)
    private readonly contacts: Repository<Contact>,
  ) {}

  listGroups(): Promise<ProviderGroup[]> {
    return this.provider.listGroups();
  }

  async getGroup(id: string): Promise<ProviderGroup & { members: Contact[] }> {
    const group = (await this.provider.listGroups()).find((g) => g.id === id);
    if (!group) throw new NotFoundException(`Recipient list ${id} not found`);
    const members = await this.contacts.find({
      where: { listId: id },
      order: { name: 'ASC' },
    });
    return { ...group, members };
  }

  async createList(name: string, description?: string): Promise<ProviderGroup> {
    const list = await this.lists.save(
      this.lists.create({
        id: `list-${randomUUID().slice(0, 8)}`,
        name: name.trim(),
        description: description?.trim(),
        memberCount: 0,
        supported: true,
      }),
    );
    this.logger.log(`AUDIT list.created id=${list.id} name="${list.name}"`);
    return { ...list, memberCount: 0 };
  }

  async deleteList(id: string): Promise<{ deleted: true }> {
    const result = await this.lists.delete({ id });
    if (!result.affected) throw new NotFoundException(`Recipient list ${id} not found`);
    await this.contacts.delete({ listId: id });
    this.logger.log(`AUDIT list.deleted id=${id}`);
    return { deleted: true };
  }

  async addContact(listId: string, name: string, phone: string): Promise<Contact> {
    const list = await this.lists.findOne({ where: { id: listId } });
    if (!list) throw new NotFoundException(`Recipient list ${listId} not found`);
    const normalized = phone.replace(/[\s()-]/g, '');
    if (!E164.test(normalized)) {
      throw new BadRequestException(
        'Phone number must be in international E.164 format, e.g. +919876543210',
      );
    }
    const existing = await this.contacts.findOne({
      where: { listId, phone: normalized },
    });
    if (existing) {
      throw new ConflictException(`${normalized} is already in this list`);
    }
    const contact = await this.contacts.save(
      this.contacts.create({ listId, name: name.trim(), phone: normalized }),
    );
    this.logger.log(`AUDIT contact.added list=${listId}`);
    return contact;
  }

  async removeContact(listId: string, contactId: string): Promise<{ deleted: true }> {
    const result = await this.contacts.delete({ id: contactId, listId });
    if (!result.affected) throw new NotFoundException(`Contact ${contactId} not found`);
    this.logger.log(`AUDIT contact.removed list=${listId}`);
    return { deleted: true };
  }
}
