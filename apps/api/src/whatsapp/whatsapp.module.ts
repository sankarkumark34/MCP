import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsAppGroup } from '../entities/whatsapp-group.entity';
import { Contact } from '../entities/contact.entity';
import { MockWhatsAppProvider } from './mock-whatsapp.provider';
import { WWebJsProvider } from './wwebjs.provider';
import { WHATSAPP_PROVIDER } from './whatsapp-provider.interface';

@Module({
  imports: [TypeOrmModule.forFeature([WhatsAppGroup, Contact])],
  providers: [
    MockWhatsAppProvider,
    WWebJsProvider,
    {
      provide: WHATSAPP_PROVIDER,
      inject: [ConfigService, MockWhatsAppProvider, WWebJsProvider],
      useFactory: (
        config: ConfigService,
        mock: MockWhatsAppProvider,
        wweb: WWebJsProvider,
      ) =>
        config.get<string>('WHATSAPP_PROVIDER', 'mock') === 'whatsapp-web'
          ? wweb
          : mock,
    },
  ],
  exports: [WHATSAPP_PROVIDER],
})
export class WhatsAppModule {}
