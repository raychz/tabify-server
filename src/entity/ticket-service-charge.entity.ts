import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    ManyToMany,
    JoinTable,
} from 'typeorm';
import { Ticket, User } from '@tabify/entities';

export interface ITicketServiceCharge {
    id?: number;
    omnivore_id: number;
    comment: string;
    name: string;
    price: number;
}

@Entity()
export class TicketServiceCharge implements ITicketServiceCharge {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'int', nullable: false })
    omnivore_id!: number;

    @Column({ type: 'varchar', nullable: false })
    comment!: string;

    @Column({ type: 'varchar', nullable: false })
    name!: string;

    @Column({ type: 'int', nullable: false })
    price!: number;
}
