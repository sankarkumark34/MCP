import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** An individual WhatsApp recipient belonging to a recipient list. */
@Entity('contacts')
@Index(['listId', 'phone'], { unique: true })
export class Contact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  listId: string;

  @Column()
  name: string;

  /** E.164 phone number, e.g. +919876543210 */
  @Column()
  phone: string;

  @CreateDateColumn()
  createdAt: Date;
}
