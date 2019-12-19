import { Injectable } from '@nestjs/common';
import { getRepository } from 'typeorm';
import { Server as ServerEntity, Ticket as TicketEntity, Ticket } from '@tabify/entities';
import { SMSService } from './sms.service';
import * as currency from 'currency.js';

// This service handles operations for the Server entity
@Injectable()
export class ServerService {

    constructor(
        private messageService: SMSService,
    ) { }

    async getServerByRefCode(referralCode: string) {
        const serverRepo = await getRepository(ServerEntity);
        const server = await serverRepo.find({ where: { referralCode }, relations: ['location'] });
        return server;
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
        const ticketTotalObj = ticket.ticketTotal;

        if (ticketTotalObj && server && server.phone) {
            const ticketTotal = currency(ticketTotalObj.total / 100);
            const ticketTip = currency(ticketTotalObj.tips / 100);

            const serverCellNum = server.phone;
            const serverName = server.firstName;

            const message = `Hi ${serverName}, for closing ticket# ${ticketNum}, ` +
                `the total was $${ticketTotal}, and the tip was $${ticketTip}. Thanks, Tabify.`;

            await this.messageService.sendSMS(serverCellNum, message);
        }
    }
}
