import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('whatsapp_groups')
export class WhatsAppGroup {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 0 })
  memberCount: number;

  @Column({ default: true })
  supported: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
