import { Injectable } from '@nestjs/common';
import { getRepository } from 'typeorm';
import { Server as ServerEntity, ServerReward as ServerRewardEntity, Ticket as TicketEntity } from '@tabify/entities';

// This service handles operations for the Server entity
@Injectable()
export class ServerService {

    async getServerByRefCode(refCode: string) {
        const serverRepo = await getRepository(ServerEntity);
        const server = await serverRepo.find({ where: { referralCode: refCode }, relations: ['location'] });
        return server;
    }

    async addServerReward(ticketId: number) {

        // get all servers for NEW USERS of ticket being closed
        // This will get unique servers
        const serverRepo = await getRepository(ServerEntity);
        const servers = await serverRepo.createQueryBuilder('server')
            .innerJoin('server.users', 'userDetails', 'userDetails.newUser = true', { newUserStatus: true })
            .innerJoin('userDetails.user', 'user')
            .innerJoin('user.tickets', 'ticket', 'ticket.id = :ticketId', { ticketId })
            .getMany();

        const numServers = servers.length;

        // calculate payment amount. 1/numServers
        // use currency.js
        const payment_amount = 1 / numServers;
        const payment_amount_floored = Math.floor(payment_amount * 100) / 100;

        const ticketRepo = await getRepository(TicketEntity);
        const ticketToAssign = await ticketRepo.find({ where: { id: ticketId } });

        // store all server rewards
        const serverRewards: ServerRewardEntity[] = [];

        // add server-ticket to server reward table
        servers.forEach(eachServer => {
            const serverReward = new ServerRewardEntity();
            serverReward.payment_amount = payment_amount_floored;
            serverReward.server = eachServer;
            serverReward.ticket = ticketToAssign[0];
            serverRewards.push(serverReward);
        });

        // save server rewards in server rewards table
        const serverRewardsRepo = await getRepository(ServerRewardEntity);
        const saveServerRewards = await serverRewardsRepo.save(serverRewards);

        return servers;
    }

}
