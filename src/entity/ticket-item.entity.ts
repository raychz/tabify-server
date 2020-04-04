import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
  Index,
} from 'typeorm';
import { Ticket, User, TicketItemUser, TabifyBaseEntity} from '@tabify/entities';

@Entity()
export class TicketItem extends TabifyBaseEntity {
  @Column({ type: 'int', nullable: false })
  ticket_item_id?: number;

  @Index()
  @ManyToOne(type => Ticket, (ticket: Ticket) => ticket.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  ticket?: Ticket;

  @Column({ type: 'varchar', nullable: false })
  name?: string;

  @Column({ type: 'int', nullable: false })
  price?: number;

  @Column({ type: 'int', nullable: false })
  quantity?: number;

  @OneToMany(type => TicketItemUser, ticketItemUser => ticketItemUser.ticketItem)
  users?: TicketItemUser[];
}
