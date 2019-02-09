import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { Ticket } from '.';
import { TicketItem } from './ticket-item.entity';

@Entity()
export class User {
  @Column('varchar', { length: 255, primary: true, nullable: false })
  uid!: string;

  @ManyToMany(type => Ticket)
  @JoinTable()
  tickets!: Ticket[];

  @ManyToMany(type => TicketItem)
  @JoinTable()
  ticketItems!: TicketItem[];
}
