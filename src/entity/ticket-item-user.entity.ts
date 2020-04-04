import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, Unique, Index } from 'typeorm';
import { TicketItem, User, TabifyBaseEntity } from '@tabify/entities';

@Entity()
@Unique(['ticketItem', 'user'])
export class TicketItemUser extends TabifyBaseEntity{
  @Index()
  @ManyToOne(type => TicketItem, ticketItem => ticketItem.users, { nullable: false, onDelete: 'CASCADE' })
  ticketItem!: TicketItem;

  @Index()
  @ManyToOne(type => User, user => user.ticketItems, { nullable: false })
  user!: User;

  @Column({ type: 'int', nullable: false })
  price!: number;
}
