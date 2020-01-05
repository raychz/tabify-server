import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
  } from 'typeorm';
import { Location } from './location.entity';
import { User } from './user.entity';
import { UserToCoupons } from './user_coupons_coupon.entity';
import { TicketPayment } from './ticket-payment.entity';
import { TicketUser } from './ticket-user.entity';
import { ApplicableCoupon } from './ticket-user-applicable-coupon';

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
    description!: string;

    @Column({ type: 'int', nullable: false })
    value!: number;

    @Column({ type: 'int', nullable: false })
    estimated_dollar_value!: number;

    @Column({ type: 'int', nullable: false })
    usage_limit!: number;

    @CreateDateColumn()
    date_created?: Date;

    @UpdateDateColumn()
    date_updated?: Date;

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
    menu_item_id?: number;

    @Column({ type: 'bool', nullable: false})
    applies_to_everyone!: boolean;

    @ManyToOne(type => Location, location => location.coupons, {
      cascade: true,
    })
    location?: Location;

    @OneToMany(type => UserToCoupons, userCoupon => userCoupon.coupon)
    userToCoupons?: UserToCoupons[];

    @OneToMany(type => ApplicableCoupon, applicableCoupon => applicableCoupon.coupon)
    applicableCoupons?: ApplicableCoupon[];
  }