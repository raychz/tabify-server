import { Entity, PrimaryGeneratedColumn, ManyToOne, OneToOne, JoinColumn, Column, OneToMany } from 'typeorm';
import { Server, Ticket, TabifyBaseEntity } from '@tabify/entities';

@Entity()
export class ServerReward extends TabifyBaseEntity{
    @ManyToOne(type => Server, server => server.serverRewards)
    server!: Server;

    @ManyToOne(type => Ticket, ticket => ticket.serverReward)
    ticket!: Ticket;

    // TODO: change to pennies. Use currency.js. Use number, not float
    @Column({ type: 'float', nullable: false })
    payment_amount!: number;

}
