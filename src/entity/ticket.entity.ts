import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Unique,
} from 'typeorm';
import { TicketItem, TicketPayment, User } from '.';

@Entity()
@Unique(['ticket_number', 'tab_id', 'location'])
export class Ticket {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: false })
  tab_id!: number;

  @Column({ type: 'varchar', nullable: false })
  location!: string;

  @Column({ type: 'int', nullable: false })
  ticket_number!: number;

  @OneToMany(type => TicketItem, item => item.ticket)
  items!: TicketItem[];

  @OneToMany(type => TicketPayment, item => item.id)
  payments!: TicketPayment[];

  @OneToMany(type => User, user => user.uid)
  users!: User[];

  @CreateDateColumn()
  date_created!: Date;
}
