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

  /** The subtotal in cents before tax (items + other_charges - discounts) */
  @Column({ type: 'int', nullable: false })
  sub_total!: number;

  /** The total tax in cents on the ticket */
  @Column({ type: 'int', nullable: false })
  tax!: number;

  /** The total value in cents of applied tips */
  @Column({ type: 'int', nullable: false })
  tips!: number;

  /** The final amount in cents to be paid (subtotal + service_charges + tax), not including tip */
  @Column({ type: 'int', nullable: false })
  total!: number;

  /** Selected items count */
  @Column({ type: 'int', nullable: false })
  selectedItemsCount!: number;
}
