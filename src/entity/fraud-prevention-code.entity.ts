import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { Ticket, User, TabifyBaseEntity } from '@tabify/entities';

@Entity()
export class FraudPreventionCode extends TabifyBaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', nullable: false })
  code!: string;

  @ManyToOne(type => Ticket, ticket => ticket.fraudPreventionCodes, {
    onDelete: 'CASCADE',
  })
  ticket!: Ticket;

  @ManyToOne(type => User, user => user.fraudPreventionCodes)
  user!: User;
}
