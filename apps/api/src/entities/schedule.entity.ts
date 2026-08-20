import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type ScheduleFrequency = 'daily' | 'weekdays' | 'weekends' | 'weekly';

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  targetGroupId: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: 'daily' })
  frequency: ScheduleFrequency;

  /** HH:mm 24h local time in `timezone` */
  @Column()
  time: string;

  @Column({ default: 'Asia/Kolkata' })
  timezone: string;

  /** 0-6 (Sunday=0), only used when frequency = weekly */
  @Column({ type: 'int', nullable: true })
  weekday: number | null;

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
