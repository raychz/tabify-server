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
  Index,
  UpdateDateColumn,
} from 'typeorm';
import { FraudPreventionCode, ILocation, ITicketItem, Location, Story, TicketItem, User } from '@tabify/entities';
import { TicketTotal } from './ticket-total.entity';

export enum TicketStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

@Entity()
@Unique(['tab_id', 'location'])
export class Ticket {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'varchar', nullable: false })
  tab_id!: string;

  @Column({ type: 'int', nullable: false })
  ticket_number!: number;

  @ManyToOne(type => Location, location => location.tickets)
  location!: Location;

  @OneToMany(type => TicketItem, (item: TicketItem) => item.ticket, {
    cascade: true,
  })
  items!: TicketItem[];

  @CreateDateColumn()
  date_created?: Date;

  @UpdateDateColumn()
  date_modified?: Date;

  @OneToMany(type => FraudPreventionCode, fraudPreventionCode => fraudPreventionCode.id, {
    cascade: true,
  })
  fraudPreventionCodes?: FraudPreventionCode[];

  @OneToOne(type => Story, story => story.ticket)
  story?: Story;

  @ManyToMany(type => User, user => user.tickets,
    {
      cascade: true,
    })
  @JoinTable()
  users?: User[];

  @Index()
  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.OPEN,
  })
  ticket_status?: TicketStatus;

  @OneToOne(type => TicketTotal, ticketTotal => ticketTotal.ticket, { cascade: true })
  ticketTotal?: TicketTotal;
}
