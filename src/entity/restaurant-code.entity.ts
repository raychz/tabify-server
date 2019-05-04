import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Ticket, User } from '.';

@Entity()
export class RestaurantCode {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', nullable: false })
  code!: string;

  @CreateDateColumn()
  date_created!: Date;

  @UpdateDateColumn()
  date_updated!: Date;

  @ManyToOne(type => Ticket, ticket => ticket.restaurantCodes)
  ticket!: Ticket;

  @ManyToOne(type => User, user => user.restaurantCodes)
  user!: User;
}
