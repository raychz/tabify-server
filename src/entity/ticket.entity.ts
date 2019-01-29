import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  Unique,
  JoinColumn
} from 'typeorm';
import { TicketItem, User } from '.';
import { Location } from './location.entity';

@Entity()
@Unique(['ticket_number', 'tab_id', 'location'])
export class Ticket {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: false })
  tab_id!: number;

  @OneToOne(type => Location)
  @JoinColumn()
  location!: Location;

  @Column({ type: 'int', nullable: false })
  ticket_number!: number;

  @OneToMany(type => TicketItem, item => item.ticket)
  items!: TicketItem[];

  @CreateDateColumn()
  date_created!: Date;

  @OneToMany(type => User, user => user.uid)
  users!: User[];
}
