import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { TicketItem, User } from '@tabify/entities';

@Entity()
@Unique(['ticketItem', 'user'])
export class TicketItemUser {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(type => TicketItem, ticketItem => ticketItem.users)
  ticketItem!: TicketItem;

  @ManyToOne(type => User, user => user.ticketItems)
  user!: User;
}
