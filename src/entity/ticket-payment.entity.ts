import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
} from 'typeorm';
import { Ticket, User, TabifyBaseEntity } from '@tabify/entities';
import { TicketPaymentStatus } from '../enums/ticket-payment-status.enum';
import { PaymentMethod } from './payment-method.entity';

/** Saves the ticket payment metadata that we get back from Omnivore */
@Entity()
export class TicketPayment extends TabifyBaseEntity {
    @Column({ type: 'int' })
    amount?: number;

    @Column({ type: 'int' })
    tip?: number;

    /** Spreedly transaction message */
    @Column({ type: 'varchar', nullable: true })
    message?: string;

    /** Omnivore's payment id */
    @Column({ type: 'varchar', nullable: true })
    omnivore_id?: string;

    /** Omnivore's response to Spreedly's payment method delivery */
    @Column({ type: 'mediumtext', nullable: true })
    omnivore_response?: string;

    /** Spreedly transaction token */
    @Column({ type: 'varchar', nullable: true })
    transaction_token?: string;

    @Column({
        type: 'enum',
        enum: TicketPaymentStatus,
        default: TicketPaymentStatus.PENDING,
        nullable: false,
    })
    ticket_payment_status?: TicketPaymentStatus;

    @ManyToOne(type => Ticket, (ticket: Ticket) => ticket.ticketPayments, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    ticket?: Ticket;

    @ManyToOne(type => User, user => user.ticketPayments, { nullable: false })
    user?: User;

    @ManyToOne(type => PaymentMethod, paymentMethod => paymentMethod.ticketPayment)
    paymentMethod?: PaymentMethod;
}
