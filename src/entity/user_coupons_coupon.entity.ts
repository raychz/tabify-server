import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User, Coupon, TabifyBaseEntity } from '@tabify/entities';

@Entity()
export class UserToCoupons extends TabifyBaseEntity{
  @Column({ type: 'int', nullable: false })
  usage_count!: number;

  @ManyToOne(type => User, user => user.userToCoupons)
  user!: User;

  @ManyToOne(type => Coupon, coupon => coupon.userToCoupons)
  coupon!: Coupon;
}
