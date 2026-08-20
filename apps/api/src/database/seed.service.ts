import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { WhatsAppGroup } from '../entities/whatsapp-group.entity';
import { MessageTemplate } from '../entities/message-template.entity';
import { Contact } from '../entities/contact.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(WhatsAppGroup)
    private readonly groups: Repository<WhatsAppGroup>,
    @InjectRepository(MessageTemplate)
    private readonly templates: Repository<MessageTemplate>,
    @InjectRepository(Contact)
    private readonly contacts: Repository<Contact>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedAdmin();
    await this.seedGroups();
    await this.seedContacts();
    await this.seedTemplates();
  }

  private async seedAdmin(): Promise<void> {
    const email = this.config.get<string>('ADMIN_EMAIL', 'admin@example.com');
    const existing = await this.users.findOne({ where: { email } });
    if (existing) return;
    const password = this.config.get<string>('ADMIN_PASSWORD', 'admin123');
    await this.users.save(
      this.users.create({
        email,
        passwordHash: await bcrypt.hash(password, 10),
        name: this.config.get<string>('ADMIN_NAME', 'Admin'),
        role: 'admin',
      }),
    );
    this.logger.log(`Seeded admin user ${email}`);
  }

  private async seedGroups(): Promise<void> {
    if ((await this.groups.count()) > 0) return;
    await this.groups.save([
      this.groups.create({
        id: 'group-family',
        name: 'Family Circle',
        description: 'Family group for daily updates',
        memberCount: 12,
        supported: true,
      }),
      this.groups.create({
        id: 'group-team',
        name: 'Product Team',
        description: 'Daily standup reminders and announcements',
        memberCount: 24,
        supported: true,
      }),
      this.groups.create({
        id: 'group-friends',
        name: 'Weekend Friends',
        description: 'Friends group',
        memberCount: 8,
        supported: true,
      }),
      this.groups.create({
        id: 'group-broadcast',
        name: 'Company Broadcast',
        description: 'Broadcast-only channel (provider unsupported)',
        memberCount: 240,
        supported: false,
      }),
    ]);
    this.logger.log('Seeded WhatsApp groups');
  }

  private async seedContacts(): Promise<void> {
    if ((await this.contacts.count()) > 0) return;
    await this.contacts.save([
      this.contacts.create({ listId: 'group-family', name: 'Amma', phone: '+919876500001' }),
      this.contacts.create({ listId: 'group-family', name: 'Appa', phone: '+919876500002' }),
      this.contacts.create({ listId: 'group-family', name: 'Sankar', phone: '+919876500003' }),
      this.contacts.create({ listId: 'group-team', name: 'Rahul', phone: '+919876500011' }),
      this.contacts.create({ listId: 'group-team', name: 'Priya', phone: '+919876500012' }),
      this.contacts.create({ listId: 'group-friends', name: 'Karthik', phone: '+919876500021' }),
    ]);
    this.logger.log('Seeded sample contacts');
  }

  private async seedTemplates(): Promise<void> {
    if ((await this.templates.count()) > 0) return;
    await this.templates.save([
      this.templates.create({
        name: 'Good Morning',
        body: 'Good Morning, {{group}}! Have a productive day! 🌞',
      }),
      this.templates.create({
        name: 'Standup Reminder',
        body: 'Reminder: daily standup starts in 15 minutes. Please add your updates.',
      }),
    ]);
    this.logger.log('Seeded message templates');
  }
}
