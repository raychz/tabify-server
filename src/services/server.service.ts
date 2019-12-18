import { Injectable } from '@nestjs/common';
import { getRepository } from 'typeorm';
import { Server as ServerEntity } from '@tabify/entities';

// This service handles operations for the Server entity
@Injectable()
export class ServerService {

    async getServerByRefCode(referralCode: string) {
        const serverRepo = await getRepository(ServerEntity);
        const server = await serverRepo.find({ where: { referralCode }, relations: ['location'] });
        return server;
    }

    async getServerByEmployeeId(employeeId: string) {
        const serverRepo = await getRepository(ServerEntity);
        const server = await serverRepo.findOne({ where: { employeeId }});
        return server;
    }
}
