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

    // TODO: change to pennies. Use currency.js. Use number, not float
    @Column({type: 'float', nullable: false })
    payment_amount!: number;

    @CreateDateColumn()
    date_created!: Date;
}