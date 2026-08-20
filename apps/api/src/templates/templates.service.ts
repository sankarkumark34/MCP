import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageTemplate } from '../entities/message-template.entity';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(MessageTemplate)
    private readonly templates: Repository<MessageTemplate>,
  ) {}

  findAll(): Promise<MessageTemplate[]> {
    return this.templates.find({ order: { updatedAt: 'DESC' } });
  }

  async create(name: string, body: string): Promise<MessageTemplate> {
    return this.templates.save(this.templates.create({ name: name.trim(), body }));
  }

  async update(
    id: string,
    patch: { name?: string; body?: string },
  ): Promise<MessageTemplate> {
    const template = await this.templates.findOne({ where: { id } });
    if (!template) throw new NotFoundException(`Template ${id} not found`);
    if (patch.name !== undefined) template.name = patch.name.trim();
    if (patch.body !== undefined) template.body = patch.body;
    return this.templates.save(template);
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const result = await this.templates.delete({ id });
    if (!result.affected) throw new NotFoundException(`Template ${id} not found`);
    return { deleted: true };
  }
}
