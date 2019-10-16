import {
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    Column,
    UpdateDateColumn,
    ManyToOne,
} from 'typeorm';
import { Ticket, User } from '@tabify/entities';

export enum TicketPaymentStatus {
    PENDING = 'pending',
    SUCCEEDED = 'succeeded',
    FAILED = 'failed',
}

/** Saves the ticket payment metadata that we get back from Omnivore */
@Entity()
export class TicketPayment {
    @PrimaryGeneratedColumn()
    id?: number;

    @CreateDateColumn()
    date_created?: Date;

    @UpdateDateColumn()
    date_updated?: Date;

    @Column({ type: 'int' })
    amount?: number;

    @Column({ type: 'int' })
    tip?: number;

    /** Spreedly transaction message */
    @Column({ type: 'varchar' })
    message?: string;

    /** Omnivore's payment id */
    @Column({ type: 'varchar' })
    omnivore_id?: string;

    /** Omnivore's response to Spreedly's payment method delivery */
    @Column({ type: 'simple-json' })
    omnivore_response?: string;

    /** Spreedly transaction token */
    @Column({ type: 'varchar' })
    transaction_token?: string;

    @Column({
        type: 'enum',
        enum: TicketPaymentStatus,
        default: TicketPaymentStatus.PENDING,
    })
    ticket_payment_status?: TicketPaymentStatus;

    @ManyToOne(type => Ticket, (ticket: Ticket) => ticket.ticketPayments, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    ticket?: Ticket;

    @ManyToOne(type => User, user => user.ticketPayments, { nullable: false })
    user?: User;
}
