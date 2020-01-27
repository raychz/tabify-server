import { Injectable } from '@nestjs/common';
import { getRepository } from 'typeorm';
import { TicketTotal } from '@tabify/entities';
import { SpreedlyService, TicketService, AblyService } from '@tabify/services';
import { TicketUpdates } from '../enums';

@Injectable()
export class TicketTotalService {
  constructor(private readonly ablyService: AblyService) { }

  async updateTicketTotals(ticketTotal: TicketTotal, ticketId: number) {
    const ticketTotalRepo = await getRepository(TicketTotal);
    const updatedTicketTotal = await ticketTotalRepo.save(ticketTotal);
    await this.ablyService.publish(TicketUpdates.TICKET_TOTALS_UPDATED, updatedTicketTotal, ticketId.toString());
    return updatedTicketTotal;
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
