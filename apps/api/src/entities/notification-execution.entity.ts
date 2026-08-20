import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type ExecutionStatus =
  | 'PENDING'
  | 'SENT'
  | 'FAILED'
  | 'RETRIED'
  | 'SKIPPED';

@Entity('notification_executions')
export class NotificationExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  scheduleId: string;

  @Column({ unique: true })
  idempotencyKey: string;

  @Column()
  scheduledAt: Date;

  @Column({ default: 'PENDING' })
  @Index()
  status: ExecutionStatus;

  @Column({ default: 0 })
  attemptCount: number;

  @Column({ nullable: true })
  providerMessageId: string;

  @Column({ nullable: true })
  errorCode: string;

  @Column({ nullable: true, type: 'text' })
  errorMessage: string;

  @Column({ nullable: true, type: 'int' })
  durationMs: number;

  /** true when triggered via the manual "Send Test" action */
  @Column({ default: false })
  isTest: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
