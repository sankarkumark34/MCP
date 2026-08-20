import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Optional AI-assisted message composing (OpenAI). Available only when
 * OPENAI_API_KEY is configured; the console degrades gracefully without it.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string | undefined;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('OPENAI_API_KEY') || undefined;
  }

  get enabled(): boolean {
    return Boolean(this.apiKey);
  }

  async composeMessage(prompt: string, tone: string): Promise<{ message: string }> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException(
        'AI composing is not configured (OPENAI_API_KEY missing)',
      );
    }
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 300,
        messages: [
          {
            role: 'system',
            content: `You write short WhatsApp group messages. Tone: ${tone}. Reply with the message text only — no quotes, no explanations. Keep it under 400 characters. Emoji are welcome when they fit the tone.`,
          },
          { role: 'user', content: prompt },
        ],
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      this.logger.warn(`OpenAI request failed: ${response.status}`);
      throw new BadGatewayException(
        `AI provider error (${response.status}): ${body.slice(0, 200)}`,
      );
    }
    const data = (await response.json()) as {
      choices: { message: { content: string } }[];
    };
    const message = data.choices?.[0]?.message?.content?.trim();
    if (!message) throw new BadGatewayException('AI provider returned no content');
    return { message };
  }
}
