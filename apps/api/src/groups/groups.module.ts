import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsAppGroup } from '../entities/whatsapp-group.entity';
import { Contact } from '../entities/contact.entity';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

@Module({
  imports: [WhatsAppModule, TypeOrmModule.forFeature([WhatsAppGroup, Contact])],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
