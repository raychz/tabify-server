import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Coupon } from './coupon.entity';

@Entity()
export class UserToCoupons {
  @PrimaryGeneratedColumn()
  id?: number;

  @CreateDateColumn()
  date_created!: Date;

  @Column({ type: 'int', nullable: false })
  usage_count!: number;

  @ManyToOne(type => User, user => user.userToCoupons)
  user!: User;

  @ManyToOne(type => Coupon, coupon => coupon.userToCoupons, {
    cascade: true,
  })
  coupon!: Coupon;
}
