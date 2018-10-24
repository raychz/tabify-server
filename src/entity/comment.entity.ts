import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  ManyToMany,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Ticket, User } from './';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToMany(type => User, user => user.uid)
  user!: User;

  @ManyToOne(type => Ticket, ticket => ticket.id)
  ticket!: Ticket;

  @Column({ type: 'text', nullable: false })
  content!: string;

  @UpdateDateColumn()
  date_edited!: Date;

  @CreateDateColumn()
  date_posted!: Date;
}
