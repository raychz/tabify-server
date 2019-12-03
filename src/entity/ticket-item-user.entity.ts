import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, Unique, Index } from 'typeorm';
import { TicketItem, User } from '@tabify/entities';

@Entity()
@Unique(['ticketItem', 'user'])
export class TicketItemUser {
  @PrimaryGeneratedColumn()
  id?: number;

  @Index()
  @ManyToOne(type => TicketItem, ticketItem => ticketItem.users, { nullable: false })
  ticketItem!: TicketItem;

  @Index()
  @ManyToOne(type => User, user => user.ticketItems, { nullable: false })
  user!: User;

  @Column({ type: 'int', nullable: false })
  price!: number;
}
