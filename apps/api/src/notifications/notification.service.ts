import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationExecution } from '../entities/notification-execution.entity';
import { Schedule } from '../entities/schedule.entity';
import {
  ProviderError,
  WHATSAPP_PROVIDER,
  WhatsAppProvider,
} from '../whatsapp/whatsapp-provider.interface';
import { dailyIdempotencyKey, testIdempotencyKey } from './idempotency';

@Injectable()
export class NotificationService implements OnApplicationShutdown {
  private readonly logger = new Logger(NotificationService.name);
  private readonly maxAttempts: number;
  private readonly retryBaseDelayMs: number;
  private readonly sendTimeoutMs: number;
  private shuttingDown = false;

  constructor(
    config: ConfigService,
    @InjectRepository(NotificationExecution)
    private readonly executions: Repository<NotificationExecution>,
    @InjectRepository(Schedule)
    private readonly schedules: Repository<Schedule>,
    @Inject(WHATSAPP_PROVIDER) private readonly provider: WhatsAppProvider,
  ) {
    this.maxAttempts = Number(config.get('MAX_SEND_ATTEMPTS', 3));
    this.retryBaseDelayMs = Number(config.get('RETRY_BASE_DELAY_MS', 2000));
    this.sendTimeoutMs = Number(config.get('SEND_TIMEOUT_MS', 15000));
  }

  onApplicationShutdown(): void {
    this.shuttingDown = true;
  }

  /**
   * Execute a scheduled delivery exactly once per schedule per local day.
   * Returns the execution record (existing one if already processed).
   */
  async executeScheduled(
    schedule: Schedule,
    scheduledAt: Date,
  ): Promise<NotificationExecution> {
    const idempotencyKey = dailyIdempotencyKey(
      schedule.id,
      scheduledAt,
      schedule.timezone,
    );

    // Acquire the idempotency lock by inserting the unique key. A concurrent
    // or repeated tick hits the unique constraint and is skipped.
    let execution: NotificationExecution;
    try {
      execution = await this.executions.save(
        this.executions.create({
          scheduleId: schedule.id,
          idempotencyKey,
          scheduledAt,
          status: 'PENDING',
          isTest: false,
        }),
      );
    } catch {
      const existing = await this.executions.findOne({ where: { idempotencyKey } });
      if (existing) {
        this.logger.debug(`Skipping duplicate execution ${idempotencyKey}`);
        return existing;
      }
      throw new Error(`Failed to acquire idempotency lock for ${idempotencyKey}`);
    }

    return this.deliver(execution, schedule);
  }

  /** Manual protected "Send Test" — bypasses the daily idempotency key. */
  async sendTest(scheduleId: string): Promise<NotificationExecution> {
    const schedule = await this.schedules.findOne({ where: { id: scheduleId } });
    if (!schedule) throw new NotFoundException(`Schedule ${scheduleId} not found`);
    const now = new Date();
    const execution = await this.executions.save(
      this.executions.create({
        scheduleId: schedule.id,
        idempotencyKey: testIdempotencyKey(schedule.id, now.getTime()),
        scheduledAt: now,
        status: 'PENDING',
        isTest: true,
      }),
    );
    return this.deliver(execution, schedule);
  }

  private async deliver(
    execution: NotificationExecution,
    schedule: Schedule,
  ): Promise<NotificationExecution> {
    const started = Date.now();
    let attempt = 0;
    let lastError: { code: string; message: string } | null = null;

    while (attempt < this.maxAttempts && !this.shuttingDown) {
      attempt += 1;
      try {
        const result = await this.withTimeout(
          this.provider.sendGroupMessage(schedule.targetGroupId, schedule.message),
        );
        execution.status = attempt > 1 ? 'RETRIED' : 'SENT';
        execution.attemptCount = attempt;
        execution.providerMessageId = result.providerMessageId;
        execution.errorCode = null as unknown as string;
        execution.errorMessage = null as unknown as string;
        execution.durationMs = Date.now() - started;
        return this.executions.save(execution);
      } catch (err) {
        const { code, message, transient } = this.normalizeError(err);
        lastError = { code, message };
        this.logger.warn(
          `Attempt ${attempt}/${this.maxAttempts} failed for schedule "${schedule.name}": [${code}] ${message}`,
        );
        if (!transient || attempt >= this.maxAttempts) break;
        // Bounded backoff with jitter
        const delay =
          this.retryBaseDelayMs * 2 ** (attempt - 1) * (0.5 + Math.random());
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    execution.status = 'FAILED';
    execution.attemptCount = attempt;
    execution.errorCode = lastError?.code ?? 'UNKNOWN';
    execution.errorMessage = lastError?.message ?? 'Unknown error';
    execution.durationMs = Date.now() - started;
    return this.executions.save(execution);
  }

  private async withTimeout<T>(promise: Promise<T>): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(new ProviderError('Provider send timed out', 'TIMEOUT', true)),
        this.sendTimeoutMs,
      );
    });
    try {
      return await Promise.race([promise, timeout]);
    } finally {
      clearTimeout(timer!);
    }
  }

  private normalizeError(err: unknown): {
    code: string;
    message: string;
    transient: boolean;
  } {
    if (err instanceof ProviderError) {
      return { code: err.code, message: err.message, transient: err.transient };
    }
    const message = err instanceof Error ? err.message : String(err);
    return { code: 'INTERNAL', message, transient: false };
  }
}
