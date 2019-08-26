import { Injectable } from '@nestjs/common';
import { getRepository } from 'typeorm';
import { Server as ServerEntity } from '../entity';

// This service handles operations for the Server entity
@Injectable()
export class ServerService {

    async getServerByRefCode(refCode: string) {
        const serverRepo = await getRepository(ServerEntity);
        const server = await serverRepo.find({where: {referralCode: refCode}, relations: ['location']});
        return server;
    }
}
