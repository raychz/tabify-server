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

    @Column({ type: 'int', nullable: false })
    discounts!: number;

    @Column({ type: 'int', nullable: false })
    due!: number;

    @Column({ type: 'int', nullable: false })
    items!: number;

    @Column({ type: 'int', nullable: false })
    other_charges!: number;

    @Column({ type: 'int', nullable: false })
    paid!: number;

    @Column({ type: 'int', nullable: false })
    service_charges!: number;

    @Column({ type: 'int', nullable: false })
    sub_total!: number;

    @Column({ type: 'int', nullable: false })
    tax!: number;

    @Column({ type: 'int', nullable: false })
    tips!: number;

    @Column({ type: 'int', nullable: false })
    total!: number;

    // Bi-directional one-to-one
    @OneToOne(type => Ticket, ticket => ticket.ticketTotal, { onDelete: 'CASCADE' })
    @JoinColumn()
    ticket?: Ticket;
}
