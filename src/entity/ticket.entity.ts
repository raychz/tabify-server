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
import { FraudPreventionCode, Location, Story, TicketItem, TicketTotal, TicketPayment, User, TicketUser } from '@tabify/entities';

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
  firestore_doc_id?: string;

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
}
