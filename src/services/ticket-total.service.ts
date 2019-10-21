import { Injectable } from '@nestjs/common';
import { getRepository } from 'typeorm';
import { TicketTotal } from '@tabify/entities';
import { SpreedlyService, TicketService } from '@tabify/services';

@Injectable()
export class TicketTotalService {
  constructor() { }

  async updateTicketTotals(ticketTotal: TicketTotal) {
    const ticketTotalRepo = await getRepository(TicketTotal);
    return await ticketTotalRepo.save(ticketTotal);
  }

  async getTicketTotals(ticketId: number, relations: string[] = []) {
    const ticketTotalRepo = await getRepository(TicketTotal);
    return await ticketTotalRepo.findOne(
      {
        where: { ticket: ticketId },
        relations,
      },
    );
  }
}
