import { Injectable } from '@nestjs/common';
import { getRepository } from 'typeorm';
import { TicketItem as TicketItemEntity} from '@tabify/entities';
import { FirebaseService } from '@tabify/services';

@Injectable()
export class TicketItemService {

    constructor(
        private readonly firebaseService: FirebaseService,
      ) { }

    async getTicketItems(ticketId: number) {
        const ticketItemRepo = await getRepository(TicketItemEntity);
        const ticketItems = ticketItemRepo.find({where:  {ticket: ticketId}});
        return ticketItems;
    }

    async saveTicketItemUsers(ticketId: number) {
        const ticketItems = await this.firebaseService.retrieveTicketItemUsers(ticketId);
    }
}