import {
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    UpdateDateColumn,
    JoinColumn,
} from 'typeorm';
import { Ticket } from '@tabify/entities';

@Entity()
export class TicketTotal {
    @PrimaryGeneratedColumn()
    id?: number;

    @CreateDateColumn()
    date_created?: Date;

    @UpdateDateColumn()
    date_updated?: Date;

    /** The sum total value in cents of all ticket-level discounts */
    @Column({ type: 'int', nullable: false })
    discounts!: number;

    /** The unpaid total in cents of the ticket (total - paid) */
    @Column({ type: 'int', nullable: false })
    due!: number;

    /** The sum total cost in cents of all items on the ticket */
    @Column({ type: 'int', nullable: false })
    items!: number;

    /** The sum total cost in cents of all other charges on the ticket. Other charges are taxed */
    @Column({ type: 'int', nullable: false })
    other_charges!: number;

    /** The total amount in cents paid */
    @Column({ type: 'int', nullable: false })
    paid!: number;

    /** The sum total cost in cents of all service charges on the ticket. Service charges are not taxed */
    @Column({ type: 'int', nullable: false })
    service_charges!: number;

    /** The subtotal in cents before tax (items + other_charges - discounts) */
    @Column({ type: 'int', nullable: false })
    sub_total!: number;

    /** The total tax in cents on the ticket */
    @Column({ type: 'int', nullable: false })
    tax!: number;

    /** The total value in cents of applied tips */
    @Column({ type: 'int', nullable: false })
    tips!: number;

    /** The final amount in cents to be paid (subtotal + service_charges + tax), not including tip */
    @Column({ type: 'int', nullable: false })
    total!: number;

    // Bi-directional one-to-one
    @OneToOne(type => Ticket, ticket => ticket.ticketTotal, { onDelete: 'CASCADE' })
    @JoinColumn()
    ticket?: Ticket;
}
