// Keep up to date with tabify/src/interfaces/ticket.interface.ts
import {
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
} from 'typeorm';
import {
  FraudPreventionCode, Location, Story, TicketItem, TicketTotal, TicketPayment, User, TicketUser, Server,
  ServerReward,
  TabifyBaseEntity,
} from '@tabify/entities';
import { TicketStatus } from '../enums/ticket-status.enum';

@Entity()
@Unique(['tab_id', 'location'])
export class Ticket extends TabifyBaseEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  //TODO: Change to Omnivore ID?
  @Column({ type: 'varchar', nullable: false })
  tab_id?: string;

  // TODO: Should this have an index?
  @Index()
  @Column({ type: 'int', nullable: false })
  ticket_number?: number;

  @ManyToOne(type => Location, location => location.tickets)
  location?: Location;

  @OneToMany(type => TicketItem, (item: TicketItem) => item.ticket, {
    cascade: true,
  })
  items?: TicketItem[];

  @OneToMany(type => FraudPreventionCode, fraudPreventionCode => fraudPreventionCode.id, {
    cascade: true,
  })
  fraudPreventionCodes?: FraudPreventionCode[];

  @OneToOne(type => Story, story => story.ticket)
  story?: Story;

  @OneToMany(type => TicketUser, ticketUser => ticketUser.ticket)
  users?: TicketUser[];

  @Index()
  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.OPEN,
  })
  ticket_status?: TicketStatus;

  @OneToOne(type => TicketTotal, ticketTotal => ticketTotal.ticket, { cascade: true })
  ticketTotal?: TicketTotal;

  @OneToMany(type => TicketPayment, (payment: TicketPayment) => payment.ticket, {
    cascade: true,
  })
  ticketPayments?: TicketPayment[];

  @ManyToOne(type => Server, server => server.ticket, {
    nullable: true,
  })
  server?: Server;

  @Column({ type: 'varchar', nullable: true })
  table_name?: string;

  @OneToMany(type => ServerReward, serverReward => serverReward.ticket)
  serverReward?: ServerReward;
}
