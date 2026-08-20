import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { WhatsAppGroup } from '../entities/whatsapp-group.entity';
import { Schedule } from '../entities/schedule.entity';
import { MessageTemplate } from '../entities/message-template.entity';
import { NotificationExecution } from '../entities/notification-execution.entity';
import { Contact } from '../entities/contact.entity';
import { SeedService } from './seed.service';

const entities = [User, WhatsAppGroup, Schedule, MessageTemplate, NotificationExecution, Contact];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const type = config.get<string>('DB_TYPE', 'sqlite');
        if (type === 'postgres') {
          return {
            type: 'postgres' as const,
            host: config.get<string>('DB_HOST', 'localhost'),
            port: Number(config.get('DB_PORT', 5432)),
            username: config.get<string>('DB_USERNAME', 'postgres'),
            password: config.get<string>('DB_PASSWORD', 'postgres'),
            database: config.get<string>('DB_DATABASE', 'whatsapp_automation'),
            entities,
            synchronize: true,
          };
        }
        return {
          type: 'better-sqlite3' as const,
          database: config.get<string>('DB_DATABASE', 'data/whatsapp-automation.sqlite'),
          entities,
          synchronize: true,
        };
      },
    }),
    TypeOrmModule.forFeature(entities),
  ],
  providers: [SeedService],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
