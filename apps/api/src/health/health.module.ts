import { Controller, Get, Inject, Module } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import {
  WHATSAPP_PROVIDER,
  WhatsAppProvider,
} from '../whatsapp/whatsapp-provider.interface';

@Controller('health')
class HealthController {
  @Public()
  @Get()
  health() {
    return {
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}

@Controller('provider')
class ProviderController {
  constructor(
    @Inject(WHATSAPP_PROVIDER) private readonly provider: WhatsAppProvider,
  ) {}

  @Get('status')
  status() {
    return this.provider.getStatus();
  }

  @Get('qr')
  async qr() {
    const qr = this.provider.getQr ? await this.provider.getQr() : null;
    return { qr };
  }
}

@Module({
  imports: [WhatsAppModule],
  controllers: [HealthController, ProviderController],
})
export class HealthModule {}
