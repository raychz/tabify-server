import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
  } from 'typeorm';
import { TicketPayment, Coupon, TicketUser } from '@tabify/entities';

@Entity()
  export class ApplicableCoupon {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ type: 'int', nullable: false })
    dollar_value!: number;

    @Column({ type: 'int', nullable: false })
    estimated_tax_difference!: number;

    @ManyToOne(type => Coupon, coupon => coupon.applicableCoupons, {nullable: false})
    coupon!: Coupon;

    // this should always be the same as selectedTicketUser if it is not null
    @ManyToOne(type => TicketUser, ticketUser => ticketUser.applicable_coupons, {nullable: false})
    ticketUser!: TicketUser;

    // this should always be the same as TicketUser
    @OneToOne(type => TicketUser, ticketUser => ticketUser.selected_coupon, {nullable: true})
    selectedTicketUser?: TicketUser;

    @OneToOne(type => TicketPayment, ticketPayment => ticketPayment.applicable_coupon, {nullable: true})
    ticketPayment?: TicketPayment;
  }