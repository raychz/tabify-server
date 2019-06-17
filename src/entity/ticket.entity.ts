import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Unique,
  ManyToMany,
  JoinTable,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { TicketItem, User, FraudPreventionCode } from '.';
import { ILocation, Location } from './location.entity';
import { ITicketItem } from './ticket-item.entity';
import { Story } from './story.entity';

export interface ITicket {
  id?: number;
  tab_id: number;
  ticket_number: number;
  location: ILocation;
  items: ITicketItem[];
  date_created?: Date;
  date_modified?: Date;
  users?: User[];
  story?: Story;
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

  @ManyToOne(type => Location, location => location.tickets)
  location!: Location;

  @OneToMany(() => TicketItem, (item: TicketItem) => item.ticket, {
    cascade: true,
  })
  items!: TicketItem[];

  @CreateDateColumn()
  date_created!: Date;

  @CreateDateColumn()
  date_modified!: Date;

  @ManyToMany(type => User, {
    cascade: true,
  })
  @JoinTable()
  users!: User[];

  @OneToMany(type => FraudPreventionCode, fraudPreventionCode => fraudPreventionCode.id, {
    cascade: true,
  })
  fraudPreventionCodes!: FraudPreventionCode[];

  // If a ticket is deleted, delete story. Not viceversa
  @OneToOne(type => Story, story => story.ticket, {
    onDelete: 'CASCADE',
  })
  story!: Story;
}