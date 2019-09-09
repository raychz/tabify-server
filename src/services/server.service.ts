import { Injectable } from '@nestjs/common';
import { getRepository } from 'typeorm';
import { Server as ServerEntity } from '@tabify/entities';

// This service handles operations for the Server entity
@Injectable()
export class ServerService {

    private referralCodeLength: number = 5;
    private allowedCodeLetterOptions = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

    async getServerByRefCode(refCode: string) {
        const serverRepo = await getRepository(ServerEntity);
        const server = await serverRepo.find({where: {referralCode: refCode}, relations: ['location']});
        return server;
    }

    generateReferralCode() {
        let result;
        result = '';
        const length = this.referralCodeLength;
        const chars = this.allowedCodeLetterOptions;
        for (let i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
        return result;
      }
}
