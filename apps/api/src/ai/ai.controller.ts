import { Body, Controller, Get, Post } from '@nestjs/common';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';

class ComposeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  prompt: string;

  @IsOptional()
  @IsIn(['friendly', 'professional', 'festive', 'motivational'])
  tone?: string;
}

@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Get('status')
  status() {
    return { enabled: this.ai.enabled };
  }

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('compose')
  compose(@Body() dto: ComposeDto) {
    return this.ai.composeMessage(dto.prompt, dto.tone ?? 'friendly');
  }
}
