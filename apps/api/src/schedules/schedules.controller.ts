import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto, UpdateScheduleDto } from './schedule.dto';
import { NotificationService } from '../notifications/notification.service';

@Controller('schedules')
export class SchedulesController {
  constructor(
    private readonly schedules: SchedulesService,
    private readonly notifications: NotificationService,
  ) {}

  @Get()
  findAll() {
    return this.schedules.findAll();
  }

  @Post()
  create(@Body() dto: CreateScheduleDto) {
    return this.schedules.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.schedules.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
    return this.schedules.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.schedules.remove(id);
  }

  // Rate-limited manual test send
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post(':id/test')
  sendTest(@Param('id') id: string) {
    return this.notifications.sendTest(id);
  }

  @Post(':id/pause')
  pause(@Param('id') id: string) {
    return this.schedules.setEnabled(id, false);
  }

  @Post(':id/resume')
  resume(@Param('id') id: string) {
    return this.schedules.setEnabled(id, true);
  }
}
