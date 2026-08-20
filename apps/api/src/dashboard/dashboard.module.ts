import { Controller, Get, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule } from '../entities/schedule.entity';
import { NotificationExecution } from '../entities/notification-execution.entity';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  overview() {
    return this.dashboard.overview();
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Schedule, NotificationExecution])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
