import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Unique,
  OneToOne,
} from 'typeorm';
import { Ticket, User, TabifyBaseEntity } from '@tabify/entities';
import { TicketPayment } from './ticket-payment.entity';

@Entity()
@Unique(['user', 'fingerprint'])
export class PaymentMethod extends TabifyBaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(type => User, user => user.paymentMethods)
  user!: User;

  @Column({ type: 'varchar', nullable: false })
  token!: string;

  @Column({ type: 'varchar', nullable: false })
  fingerprint!: string;

  @Column({ type: 'varchar', nullable: false })
  last_four_digits!: string;

  @Column({ type: 'varchar', nullable: false })
  card_type!: string;

  @Column({ type: 'varchar', nullable: false })
  first_name!: string;

  @Column({ type: 'varchar', nullable: false })
  last_name!: string;

  @Column({ type: 'varchar', nullable: false })
  full_name!: string;

  @Column({ type: 'varchar', nullable: false })
  zip!: string;

  @Column({ type: 'int', nullable: false })
  month!: number;

  @Column({ type: 'int', nullable: false })
  year!: number;

  @OneToMany(type => TicketPayment, ticketPayment => ticketPayment.paymentMethod)
  ticketPayment!: TicketPayment[];
}
