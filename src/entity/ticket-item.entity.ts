import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Ticket, User } from '.';

@Entity()
export class TicketItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: false })
  ticket_item_id!: number;

  @ManyToOne(type => Ticket, ticket => ticket.items, { nullable: false })
  ticket!: Ticket;

  @Column({ type: 'varchar', nullable: false })
  name!: string;

  @Column({ type: 'int', nullable: false })
  price!: number;

  @Column({ type: 'int', nullable: false })
  quantity!: number;

  @OneToMany(type => User, user => user.uid)
  users!: User[];
}
