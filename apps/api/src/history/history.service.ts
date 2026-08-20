import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import {
  ExecutionStatus,
  NotificationExecution,
} from '../entities/notification-execution.entity';
import { Schedule } from '../entities/schedule.entity';

export interface HistoryQuery {
  scheduleId?: string;
  status?: ExecutionStatus;
  limit?: number;
  offset?: number;
}

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(NotificationExecution)
    private readonly executions: Repository<NotificationExecution>,
    @InjectRepository(Schedule)
    private readonly schedules: Repository<Schedule>,
  ) {}

  async find(query: HistoryQuery) {
    const where: FindOptionsWhere<NotificationExecution> = {};
    if (query.scheduleId) where.scheduleId = query.scheduleId;
    if (query.status) where.status = query.status;
    const limit = Math.min(query.limit ?? 50, 200);
    const [rows, total] = await this.executions.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: query.offset ?? 0,
    });
    const schedules = await this.schedules.find();
    const names = new Map(schedules.map((s) => [s.id, s.name]));
    return {
      total,
      items: rows.map((row) => ({
        ...row,
        scheduleName: names.get(row.scheduleId) ?? '(deleted schedule)',
      })),
    };
  }

  async findOne(id: string) {
    const execution = await this.executions.findOne({ where: { id } });
    if (!execution) throw new NotFoundException(`Execution ${id} not found`);
    const schedule = await this.schedules.findOne({
      where: { id: execution.scheduleId },
    });
    return { ...execution, scheduleName: schedule?.name ?? '(deleted schedule)' };
  }
}
