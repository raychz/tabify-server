import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Ticket, User, TicketItem } from '.';

@Entity()
export class TicketPayment {
  @PrimaryGeneratedColumn() id!: number;

  @CreateDateColumn()
  date_created!: Date;

  @ManyToOne(type => User, user => user.uid)
  user!: User;

  @ManyToOne(type => Ticket, ticket => ticket.id)
  ticket!: Ticket;

  @ManyToMany(type => TicketItem)
  @JoinTable({ name: 'ticket_payment_ticket_item' })
  items!: TicketItem[];

  /**
   * Id provided from the omnivore payment response
   */
  @Column({ type: 'int', nullable: false })
  payment_id!: number;

  @Column({ type: 'int', nullable: false })
  amount!: number;

  @Column({ type: 'int', nullable: false })
  tip!: number;
}
