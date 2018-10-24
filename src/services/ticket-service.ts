import { Injectable, Logger } from '@nestjs/common';
import { OmnivoreService, IOmnivoreTicket } from 'services/omnivore-service';
import { getManager, getRepository } from 'typeorm';
import { Ticket as TicketEntity, TicketItem } from '../entity';

@Injectable()
export class TicketService {
  constructor(private readonly omnivoreService: OmnivoreService) {}

  /**
   * Attemps to load a ticket from local database if exists,
   * if not, fetch it from omnivore, add it to our database, then return ticket.
   */
  async getTicket(location: string, ticket_number: string) {
    const ticketRepo = await getRepository(TicketEntity);
    const ticket = await ticketRepo.findOne({
      where: { location, ticket_number },
      relations: ['items'],
    });

    if (ticket) {
      return ticket;
    } else {
      try {
        const ticketObj = await this.omnivoreService.getTicket(
          location,
          ticket_number,
        );
        return this.saveTicket(ticketObj, location);
      } catch (error) {
        Logger.error(error.message);
      }
    }
  }

  /**
   * Saves the ticket then return the ticket object
   * @param ticket
   * @param location
   */
  async saveTicket(
    ticket: IOmnivoreTicket,
    location: string,
  ): Promise<TicketEntity | undefined> {
    const ticketRepo = await getRepository(TicketEntity);

    await getManager().transaction(async transactionalEntityManager => {
      const nTicket = new TicketEntity();
      nTicket.location = location;
      nTicket.ticket_number = ticket.ticket_number;
      nTicket.tab_id = ticket.id;

      await transactionalEntityManager.save(nTicket);
      const ticketItems = ticket.items.map(item => {
        const ticketItem = new TicketItem();
        ticketItem.name = item.name;
        ticketItem.ticket = nTicket;
        ticketItem.price = item.price;
        ticketItem.quantity = item.quantity;
        ticketItem.ticket_item_id = item.id;
        return ticketItem;
      });

      ticketItems.forEach(
        async (item: TicketItem) => await transactionalEntityManager.save(item),
      );
    });

    // TODO: Find a better way to implement this.
    //
    return ticketRepo.findOne({
      where: { location, ticket_number: ticket.ticket_number },
      relations: ['items'],
    });
  }
}
