import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, Unique, Index, OneToOne, OneToMany } from 'typeorm';
import { Ticket, User, Coupon, ApplicableCoupon } from '@tabify/entities';
import { TicketUserStatus } from '../enums/';

@Entity()
@Unique(['ticket', 'user'])
export class TicketUser {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @ManyToOne(type => Ticket, ticket => ticket.users, { nullable: false, onDelete: 'CASCADE' })
  ticket!: Ticket;

  @Index()
  @ManyToOne(type => User, user => user.tickets, { nullable: false })
  user?: User;

  /** The total cost in cents of items on the ticket selected by this user */
  @Column({ type: 'int', nullable: false, default: 0 })
  items!: number;

  /** The sum total value in cents of all discounts for this user */
  @Column({ type: 'int', nullable: false, default: 0 })
  discounts!: number;

  /** The subtotal in cents before tax (items + other_charges - discounts) */
  @Column({ type: 'int', nullable: false, default: 0 })
  sub_total!: number;

  /** The total tax due in cents for this user */
  @Column({ type: 'int', nullable: false, default: 0 })
  tax!: number;

  /** The total value in cents of applied tips for this user */
  @Column({ type: 'int', nullable: false, default: 0 })
  tips!: number;

  /** The final amount in cents to be paid (subtotal + service_charges + tax), not including tip, by this user */
  @Column({ type: 'int', nullable: false, default: 0 })
  total!: number;

  /** Selected items count */
  @Column({ type: 'int', nullable: false, default: 0 })
  selectedItemsCount!: number;

  /** Ticket user status */
  @Column({
    type: 'enum',
    enum: TicketUserStatus,
    nullable: false,
  })
  status?: TicketUserStatus;

  @OneToOne(type => ApplicableCoupon, applicableCoupon => applicableCoupon.selectedTicketUser, { nullable: true })
  selected_coupon?: ApplicableCoupon;

  @OneToMany(type => ApplicableCoupon, applicableCoupon => applicableCoupon.ticketUser)
  applicable_coupons?: ApplicableCoupon[];
}
