import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User, Coupon } from '@tabify/entities';

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

  @ManyToOne(type => Coupon, coupon => coupon.userToCoupons)
  coupon!: Coupon;
}
