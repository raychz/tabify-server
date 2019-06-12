import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Ticket, User } from '.';

@Entity()
export class FraudPreventionCode {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', nullable: false })
  code!: string;

  @CreateDateColumn()
  date_created!: Date;

  @UpdateDateColumn()
  date_updated!: Date;

  @ManyToOne(type => Ticket, ticket => ticket.fraudPreventionCodes)
  ticket!: Ticket;

  @ManyToOne(type => User, user => user.fraudPreventionCodes)
  user!: User;
}