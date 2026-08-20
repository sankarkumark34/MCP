import { Controller, Get, Param, Query } from '@nestjs/common';
import { ExecutionStatus } from '../entities/notification-execution.entity';
import { HistoryService } from './history.service';

@Controller('history')
export class HistoryController {
  constructor(private readonly history: HistoryService) {}

  @Get()
  find(
    @Query('scheduleId') scheduleId?: string,
    @Query('status') status?: ExecutionStatus,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.history.find({
      scheduleId,
      status,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.history.findOne(id);
  }
}
