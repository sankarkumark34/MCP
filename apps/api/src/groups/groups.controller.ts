import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { GroupsService } from './groups.service';

class CreateListDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;
}

class AddContactDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsString()
  @Matches(/^\+?[0-9\s()-]{7,20}$/, {
    message: 'phone must be an international number, e.g. +919876543210',
  })
  phone: string;
}

@Controller('groups')
export class GroupsController {
  constructor(private readonly groups: GroupsService) {}

  @Get()
  list() {
    return this.groups.listGroups();
  }

  @Post()
  createList(@Body() dto: CreateListDto) {
    return this.groups.createList(dto.name, dto.description);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.groups.getGroup(id);
  }

  @Delete(':id')
  deleteList(@Param('id') id: string) {
    return this.groups.deleteList(id);
  }

  @Post(':id/contacts')
  addContact(@Param('id') id: string, @Body() dto: AddContactDto) {
    return this.groups.addContact(id, dto.name, dto.phone);
  }

  @Delete(':id/contacts/:contactId')
  removeContact(@Param('id') id: string, @Param('contactId') contactId: string) {
    return this.groups.removeContact(id, contactId);
  }
}
