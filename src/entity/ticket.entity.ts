import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  Unique,
  JoinColumn,
  ManyToMany,
} from 'typeorm';
import { TicketItem, User } from '.';
import { ILocation, Location } from './location.entity';
import { ITicketItem } from './ticket-item.entity';

export interface ITicket {
  id?: number;
  tab_id: number;
  ticket_number: number;
  location: ILocation;
  items: ITicketItem[];
  date_created?: Date;
  date_modified?: Date;
  users?: User[];
}

@Entity()
@Unique(['ticket_number', 'tab_id', 'location'])
export class Ticket implements ITicket {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'int', nullable: false })
  tab_id!: number;

  @Column({ type: 'int', nullable: false })
  ticket_number!: number;

  @OneToOne(() => Location)
  @JoinColumn()
  location!: Location;

  @OneToMany(() => TicketItem, (item: TicketItem) => item.ticket)
  items!: TicketItem[];

  @CreateDateColumn()
  date_created!: Date;

  @CreateDateColumn()
  date_modified!: Date;

  @ManyToMany(type => User)
  users!: User[];
}