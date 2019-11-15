import { Injectable } from '@nestjs/common';
import { getRepository } from 'typeorm';
import { Server as ServerEntity } from '@tabify/entities';

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
        const serverRepo = await getRepository(ServerEntity);
        const servers = await serverRepo.createQueryBuilder('server')
            .innerJoin('server.users', 'userDetails', 'userDetails.newUser = true', { newUserStatus: true })
            .innerJoin('userDetails.user', 'user')
            .innerJoin('user.tickets', 'ticket', 'ticket.id = :ticketId', { ticketId })
            .getMany();

        console.log(servers);
        return servers;
    }

}
