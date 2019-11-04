import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Ticket, User } from '@tabify/entities';

@Entity()
@Unique(['ticket', 'user'])
export class TicketUser {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(type => Ticket, ticket => ticket.ticketUsers)
  ticket!: Ticket;

  @ManyToOne(type => User, user => user.ticketUsers)
  user!: User;
}
