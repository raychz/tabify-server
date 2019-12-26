import { Injectable } from '@nestjs/common';
import { getRepository } from 'typeorm';
import { Server as ServerEntity, Ticket as TicketEntity, ServerReward as ServerRewardEntity } from '@tabify/entities';
import { SMSService } from './sms.service';
import * as currency from 'currency.js';

// This service handles operations for the Server entity
@Injectable()
export class ServerService {

    constructor(
        private messageService: SMSService,
    ) { }

    private referralCodeLength: number = 4;
    private allowedCodeLetterOptions = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

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
            .innerJoin('user.tickets', 'ticketUser')
            .innerJoin('ticketUser.ticket', 'ticket', 'ticket.id = :ticketId', { ticketId })
            .getMany();

        const numServers = servers.length;

        const ticketRepo = await getRepository(TicketEntity);
        const ticketToAssign = await ticketRepo.find({ where: { id: ticketId } });

        // store all server rewards
        const serverRewards: ServerRewardEntity[] = [];

        // add server-ticket to server reward table
        servers.forEach(eachServer => {
            const serverReward = new ServerRewardEntity();
            serverReward.server = eachServer;
            serverReward.ticket = ticketToAssign[0];
            serverRewards.push(serverReward);
        });

        // distribute reward ($1) among servers
        currency(1)
        .distribute(serverRewards.length)
        .forEach((pmnt_amount, index) => {
          serverRewards[index].payment_amount = pmnt_amount.intValue;
        });

        // save server rewards in server rewards table
        const serverRewardsRepo = await getRepository(ServerRewardEntity);
        const saveServerRewards = await serverRewardsRepo.save(serverRewards);

        return servers;
    }

    // save server in DB. generate ref code
    async postServer(serverDetails: any) {
        serverDetails.referralCode = await this.generateReferralCode();
        const serverRepo = await getRepository(ServerEntity);
        const server = await serverRepo.save(serverDetails);
        return server;
    }

    async generateReferralCode() {
        let result = '';
        const length = this.referralCodeLength;
        const chars = this.allowedCodeLetterOptions;
        const serverRepo = await getRepository(ServerEntity);

        // check if ref code is already being used
        while (true) {
            for (let i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];

            const refCodeUsed = await serverRepo.findOne({ where: { referralCode: result } });

            // if refcodeUsed is undefined or null, break
            if (!refCodeUsed) {
                break;
            } else {
                result = '';
            }
        }
        return result;
    }

    async getServerByEmployeeId(employeeId: string) {
        const serverRepo = await getRepository(ServerEntity);
        const server = await serverRepo.findOne({ where: { employeeId } });
        return server;
    }

    // find the server associated with ticket, if any. Send them ticket close details
    async sendTicketCloseSMSToServer(ticketId: number) {
        const ticketRepo = await getRepository(TicketEntity);
        const ticket = await ticketRepo.findOneOrFail({ where: { id: ticketId }, relations: ['ticketTotal', 'server'] });

        const server = ticket.server;
        const ticketNum = ticket.ticket_number;
        const ticketTableName = ticket.table_name;
        const ticketTotalObj = ticket.ticketTotal;

        if (ticketTotalObj && server && server.phone) {
            const ticketTotal = currency(ticketTotalObj.total / 100);
            const ticketTip = currency(ticketTotalObj.tips / 100);

            const serverCellNum = server.phone;
            const serverName = server.firstName;

            const message = `Hi ${serverName}, for closing ticket# ${ticketNum} (Table ${ticketTableName}),` +
                ` the total was $${ticketTotal}, and the tip was $${ticketTip}. Thanks, Tabify.`;

            await this.messageService.sendSMS(serverCellNum, message);
        }
    }
}
