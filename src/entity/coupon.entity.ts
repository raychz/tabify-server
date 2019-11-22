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

@Entity()
  export class Coupon {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ type: 'varchar', nullable: false })
    header!: string;

    @Column({ type: 'varchar', nullable: false })
    description!: string;

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

    @ManyToOne(type => Location, location => location.coupons, {
      cascade: true,
    })
    location!: Location;

    @OneToMany(type => UserToCoupons, userCoupon => userCoupon.coupon, {
      cascade: true,
    })
    userToCoupons!: UserToCoupons[];
  }