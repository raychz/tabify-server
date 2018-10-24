import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from './';

@Entity()
export class PaymentMethod {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(type => User, user => user.uid, { nullable: false })
  user!: string;

  /**
   * Hash ideally store in a third party server
   */
  @Column('varchar', { length: 255, nullable: false })
  payment_method!: string;
}
