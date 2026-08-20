import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ScheduleTimingDto {
  @IsIn(['daily', 'weekdays', 'weekends', 'weekly'])
  frequency: 'daily' | 'weekdays' | 'weekends' | 'weekly';

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'time must be HH:mm (24h)' })
  time: string;

  @IsString()
  @IsNotEmpty()
  timezone: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  weekday?: number;
}

export class CreateScheduleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsString()
  @IsNotEmpty()
  targetGroupId: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @ValidateNested()
  @Type(() => ScheduleTimingDto)
  schedule: ScheduleTimingDto;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateScheduleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  targetGroupId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  message?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ScheduleTimingDto)
  schedule?: ScheduleTimingDto;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
