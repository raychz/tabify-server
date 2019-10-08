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
import { FraudPreventionCode, ILocation, ITicketItem, Location, Story, TicketItem, User } from '@tabify/entities';

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

export enum TicketStatus {
  OPEN = 'open',
  CLOSED = 'closed',
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

  @OneToMany(type => TicketItem, (item: TicketItem) => item.ticket, {
    cascade: true,
  })
  items!: TicketItem[];

  @CreateDateColumn()
  date_created!: Date;

  @CreateDateColumn()
  date_modified!: Date;

  @OneToMany(type => FraudPreventionCode, fraudPreventionCode => fraudPreventionCode.id, {
    cascade: true,
  })
  fraudPreventionCodes!: FraudPreventionCode[];

  @OneToOne(type => Story, story => story.ticket)
  story!: Story;

  @ManyToMany(type => User, user => user.tickets,
    {
      cascade: true,
    })
  @JoinTable()
  users!: User[];

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.OPEN,
  })
  ticket_status!: TicketStatus;
}