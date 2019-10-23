import { Injectable } from '@nestjs/common';
import { getRepository } from 'typeorm';
import { TicketItem as TicketItemEntity} from '@tabify/entities';

@Injectable()
export class TicketItemService {

    async getTicketItems(ticketId: number) {
        const ticketItemRepo = await getRepository(TicketItemEntity);
        const ticketItems = ticketItemRepo.find({where:  {ticket: ticketId}});
        return ticketItems;
    }
}