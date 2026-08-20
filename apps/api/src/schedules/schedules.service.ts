import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DateTime } from 'luxon';
import { Schedule } from '../entities/schedule.entity';
import { WhatsAppGroup } from '../entities/whatsapp-group.entity';
import { CreateScheduleDto, UpdateScheduleDto } from './schedule.dto';
import { humanScheduleSummary, nextRunAt } from '../scheduler/schedule-time';

export interface ScheduleView extends Schedule {
  groupName: string | null;
  nextRunAt: string | null;
  summary: string;
}

@Injectable()
export class SchedulesService {
  private readonly logger = new Logger(SchedulesService.name);

  constructor(
    @InjectRepository(Schedule)
    private readonly schedules: Repository<Schedule>,
    @InjectRepository(WhatsAppGroup)
    private readonly groups: Repository<WhatsAppGroup>,
  ) {}

  async findAll(): Promise<ScheduleView[]> {
    const [rows, groups] = await Promise.all([
      this.schedules.find({ order: { createdAt: 'DESC' } }),
      this.groups.find(),
    ]);
    const byId = new Map(groups.map((g) => [g.id, g.name]));
    return rows.map((s) => this.toView(s, byId.get(s.targetGroupId) ?? null));
  }

  async findOne(id: string): Promise<ScheduleView> {
    const schedule = await this.schedules.findOne({ where: { id } });
    if (!schedule) throw new NotFoundException(`Schedule ${id} not found`);
    const group = await this.groups.findOne({
      where: { id: schedule.targetGroupId },
    });
    return this.toView(schedule, group?.name ?? null);
  }

  async create(dto: CreateScheduleDto): Promise<ScheduleView> {
    await this.assertValid(dto.targetGroupId, dto.schedule.timezone);
    const schedule = await this.schedules.save(
      this.schedules.create({
        name: dto.name.trim(),
        targetGroupId: dto.targetGroupId,
        message: dto.message,
        frequency: dto.schedule.frequency,
        time: dto.schedule.time,
        timezone: dto.schedule.timezone,
        weekday: dto.schedule.frequency === 'weekly' ? dto.schedule.weekday ?? 0 : null,
        enabled: dto.enabled ?? true,
      }),
    );
    this.logger.log(`AUDIT schedule.created id=${schedule.id} name="${schedule.name}"`);
    return this.findOne(schedule.id);
  }

  async update(id: string, dto: UpdateScheduleDto): Promise<ScheduleView> {
    const schedule = await this.schedules.findOne({ where: { id } });
    if (!schedule) throw new NotFoundException(`Schedule ${id} not found`);
    if (dto.targetGroupId) {
      await this.assertValid(dto.targetGroupId, dto.schedule?.timezone ?? schedule.timezone);
    } else if (dto.schedule?.timezone) {
      this.assertTimezone(dto.schedule.timezone);
    }
    if (dto.name !== undefined) schedule.name = dto.name.trim();
    if (dto.targetGroupId !== undefined) schedule.targetGroupId = dto.targetGroupId;
    if (dto.message !== undefined) schedule.message = dto.message;
    if (dto.enabled !== undefined) schedule.enabled = dto.enabled;
    if (dto.schedule) {
      schedule.frequency = dto.schedule.frequency;
      schedule.time = dto.schedule.time;
      schedule.timezone = dto.schedule.timezone;
      schedule.weekday =
        dto.schedule.frequency === 'weekly' ? dto.schedule.weekday ?? 0 : null;
    }
    await this.schedules.save(schedule);
    this.logger.log(`AUDIT schedule.updated id=${id}`);
    return this.findOne(id);
  }

  async setEnabled(id: string, enabled: boolean): Promise<ScheduleView> {
    const schedule = await this.schedules.findOne({ where: { id } });
    if (!schedule) throw new NotFoundException(`Schedule ${id} not found`);
    schedule.enabled = enabled;
    await this.schedules.save(schedule);
    this.logger.log(`AUDIT schedule.${enabled ? 'resumed' : 'paused'} id=${id}`);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const result = await this.schedules.delete({ id });
    if (!result.affected) throw new NotFoundException(`Schedule ${id} not found`);
    this.logger.log(`AUDIT schedule.deleted id=${id}`);
    return { deleted: true };
  }

  private toView(schedule: Schedule, groupName: string | null): ScheduleView {
    const next = nextRunAt(schedule, new Date());
    return {
      ...schedule,
      groupName,
      nextRunAt: next ? next.toISOString() : null,
      summary: humanScheduleSummary(schedule),
    };
  }

  private async assertValid(groupId: string, timezone: string): Promise<void> {
    this.assertTimezone(timezone);
    const group = await this.groups.findOne({ where: { id: groupId } });
    if (!group) throw new BadRequestException(`Unknown WhatsApp group: ${groupId}`);
    if (!group.supported) {
      throw new BadRequestException(
        `Group "${group.name}" is not supported for automated messaging by the current provider`,
      );
    }
  }

  private assertTimezone(timezone: string): void {
    if (!DateTime.local().setZone(timezone).isValid) {
      throw new BadRequestException(`Invalid IANA timezone: ${timezone}`);
    }
  }
}
