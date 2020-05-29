import {
    Entity,
    Column,
    ManyToOne,
    OneToMany,
  } from 'typeorm';
import { Location, UserToCoupons, TabifyBaseEntity, TicketPayment, TicketUser} from '@tabify/entities';
import { stringify } from 'querystring';
import { CouponTicketInfo } from '@tabify/interfaces';

export enum CouponType {
  PERCENT = 'percent',
  DOLLAR_VALUE = 'dollar_value',
}

export enum CouponOffOf {
  TICKET = 'ticket',
  ITEM = 'item',
}

@Entity()
  export class Coupon extends TabifyBaseEntity {
    @Column({ type: 'varchar', nullable: false })
    description!: string;

    @Column({ type: 'int', nullable: false })
    value!: number;

    @Column({ type: 'int', nullable: false })
    estimated_dollar_value!: number;

    @Column({ type: 'int', nullable: true })
    usage_limit?: number;

    @Column({type: 'datetime', nullable: false})
    coupon_start_date!: Date;

    @Column({type: 'datetime', nullable: false})
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

    @Column({ type: 'varchar', nullable: true })
    menu_item_id?: string;

    @Column({ type: 'varchar', nullable: true })
    image_url?: string;

    @Column({ type: 'bool', nullable: false})
    applies_to_everyone!: boolean;

    /**
     * Coupon restrictions can include both valid (validTimes) and invalid (invalidTimes) days and times,
     * both json objects have fields 0-6 which corresponds to the days of the week - sunday through saturday.
     * Not specifying the day in either validTimes or invalidTimes will default to valid for the whole day.
     * The value of these fields are an array of objects with startTime and endTime properties,
     * these times represents the range(s) for when the coupon is valid on the given day.
     *
     * Example:
     *
     * Formatted JSON Data
     *   {
     *     "validTimes":{
     *         "1":[
     *           {
     *               "startTime":"13:00:00",
     *               "endTime":"17:70:00"
     *           }
     *         ]
     *     },
     *     "invalidTimes":{
     *         "2":[
     *           {
     *               "startTime":"10:00:00",
     *               "endTime":"12:00:00"
     *           }
     *         ]
     *     }
     *   }
     *
     */
    @Column({ type: 'json', nullable: true})
    coupon_restrictions?: any;

    @ManyToOne(type => Location, location => location.coupons, {
      cascade: true,
    })
    location?: Location;

    @OneToMany(type => UserToCoupons, userCoupon => userCoupon.coupon)
    userToCoupons?: UserToCoupons[];

    @OneToMany(type => TicketUser, ticketUser => ticketUser.selected_coupon, { nullable: true })
    selectedTicketUsers?: TicketUser[];

    @OneToMany(type => TicketPayment, ticketPayment => ticketPayment.coupon, { nullable: true })
    ticketPayments?: TicketPayment[];

    // this field should be left null in the db but will be populated on a per ticket basis before being sent to the frontend
    @Column({type: 'json', nullable: true, default: null})
    ticket_information?: CouponTicketInfo;
  }