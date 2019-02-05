import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Ticket, User } from '.';

export interface ITicketItem {
  id?: number;
  ticket_item_id: number;
  name: string;
  comment?: string;
  price: number;
  quantity: number;
  sent?: boolean;
  sent_at?: number;
  split?: number;
  users?: User[];
}

@Entity()
export class TicketItem implements ITicketItem{
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: false })
  ticket_item_id!: number;

  @ManyToOne(type => Ticket, (ticket: Ticket) => ticket.items, { nullable: false })
  ticket!: Ticket;

  @Column({ type: 'varchar', nullable: false })
  name!: string;

  @Column({ type: 'int', nullable: false })
  price!: number;

  @Column({ type: 'int', nullable: false })
  quantity!: number;

  @OneToMany(type => User, (user: User) => user.uid)
  users!: User[];
}
