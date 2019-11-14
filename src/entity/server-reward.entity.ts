import { Entity, PrimaryGeneratedColumn, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { Server, Ticket } from '@tabify/entities';

@Entity()
export class ServerReward {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(type => Server, server => server.serverRewards)
    server!: Server;

    @OneToOne(type => Ticket, ticket => ticket.serverReward)
    @JoinColumn()
    ticket!: Ticket;
}