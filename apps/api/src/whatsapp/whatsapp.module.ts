import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsAppGroup } from '../entities/whatsapp-group.entity';
import { MockWhatsAppProvider } from './mock-whatsapp.provider';
import { WHATSAPP_PROVIDER } from './whatsapp-provider.interface';

@Module({
  imports: [TypeOrmModule.forFeature([WhatsAppGroup])],
  providers: [
    MockWhatsAppProvider,
    { provide: WHATSAPP_PROVIDER, useExisting: MockWhatsAppProvider },
  ],
  exports: [WHATSAPP_PROVIDER],
})
export class WhatsAppModule {}
