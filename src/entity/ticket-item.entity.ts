import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
} from 'typeorm';
import { Ticket, TicketPayment } from '.';

@Entity()
export class TicketItem {
  @PrimaryGeneratedColumn() id: number;

  @Column({ type: 'int', nullable: false })
  ticket_item_id: number;

  @ManyToOne(type => Ticket, ticket => ticket.items, { nullable: false })
  ticket: Ticket;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'int', nullable: false })
  price: number;

  @Column({ type: 'int', nullable: false })
  quantity: number;

  /**
   * One TicketItem can have a relationship to many payments
   */
  @ManyToMany(type => TicketPayment)
  payments: TicketPayment[];
}
