import { Controller, Get, Param } from '@nestjs/common';
import { GroupsService } from './groups.service';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groups: GroupsService) {}

  @Get()
  list() {
    return this.groups.listGroups();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.groups.getGroup(id);
  }
}
