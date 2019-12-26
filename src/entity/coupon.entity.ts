import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Location, User, TicketPayment, UserToCoupons } from '@tabify/entities';

export enum CouponType {
PERCENT = 'percent',
DOLLAR_VALUE = 'dollar_value',
}

export enum CouponOffOf {
TICKET = 'ticket',
ITEM = 'item',
}

@Entity()
export class Coupon {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'varchar', nullable: false })
  header!: string;

  // @Column({ type: 'varchar', nullable: false })
  // description!: string;

  @Column({ type: 'int', nullable: false })
  value!: number;

  @Column({ type: 'int', nullable: false })
  usage_limit!: number;

  @CreateDateColumn()
  date_created!: Date;

  @UpdateDateColumn()
  date_updated!: Date;

  @Column({type: 'date', nullable: false})
  coupon_start_date!: Date;

  @Column({type: 'date', nullable: false})
  coupon_end_date!: Date;

  @Column({
    type: 'enum',
    enum: CouponType,
  })
  coupon_type!: CouponType;

  @Column({
    type: 'enum',
    enum: CouponOffOf,
  })
  coupon_off_of!: CouponOffOf;

  @Column({ type: 'int', nullable: true })
  menu_item?: number;

  @ManyToOne(type => Location, location => location.coupons, {
    cascade: true,
  })
  location!: Location;

  // @OneToMany(type => UserToCoupons, userCoupon => userCoupon.coupon)
  // userToCoupons?: UserToCoupons[];

  // @ManyToMany(type => User, user => user.coupons)
  // @JoinTable()
  // users!: User[];

  @OneToMany(type => TicketPayment, ticketPayment => ticketPayment.coupon)
  ticketPayments!: TicketPayment[];
}