import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Ticket, User } from '@tabify/entities';

@Entity()
@Unique(['ticket', 'user'])
export class TicketUser {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(type => Ticket, ticket => ticket.users)
  ticket!: Ticket;

  @ManyToOne(type => User, user => user.tickets)
  user!: User;

  @Column({ type: 'int', nullable: false })
  sub_total!: number;

  @Column({ type: 'int', nullable: false })
  tax!: number;

  @Column({ type: 'int', nullable: false })
  tips!: number;

  @Column({ type: 'int', nullable: false })
  total!: number;
}
