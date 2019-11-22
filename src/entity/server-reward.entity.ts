import { Entity, PrimaryGeneratedColumn, ManyToOne, OneToOne, JoinColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Server, Ticket } from '@tabify/entities';

@Entity()
export class ServerReward {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(type => Server, server => server.serverRewards)
    server!: Server;

    @ManyToOne(type => Ticket, ticket => ticket.serverReward)
    ticket!: Ticket;

    @Column({ nullable: false })
    payment_amount!: number;

    @CreateDateColumn()
    date_created!: Date;
}