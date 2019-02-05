import { Injectable, Logger } from '@nestjs/common';
import { OmnivoreService } from '../services/omnivore.service';
import { getManager, getRepository, EntityManager } from 'typeorm';
import { Location as LocationEntity, Ticket as TicketEntity } from '../entity';
import { ITicket } from '../entity/ticket.entity';
import { TicketItem as TicketItemEntity, ITicketItem  } from '../entity/ticket-item.entity';

@Injectable()
export class TicketService {
  constructor(private readonly omnivoreService: OmnivoreService) {}

  /**
   * Attemps to load a ticket from local database if exists,
   * if not, fetch it from omnivore, add it to our database, then return ticket.
   */
  async getTicket(omnivoreLocationId: string, ticket_number: string) {
    const ticketRepo = await getRepository(TicketEntity);
    const ticket = await ticketRepo.findOne({
      where: { locationId: omnivoreLocationId, ticket_number },
      relations: ['items', 'location'],
    });

    if (ticket) {
      return ticket;
    } else {
      try {
        const ticketObj = await this.omnivoreService.getTicket(
          omnivoreLocationId,
          ticket_number,
        );
        return this.saveTicket(ticketObj);
      } catch (error) {
        Logger.error(error.message);
      }
    }
  }

  /**
   * Saves the ticket then return the ticket object
   * @param ticket
   */
  async saveTicket(
    ticket: ITicket,
  ): Promise<TicketEntity | undefined> {
    const ticketRepo = await getRepository(TicketEntity);

    await getManager().transaction(async (transactionalEntityManager: EntityManager) => {
      const nTicket = new TicketEntity();
      nTicket.location = ticket.location;
      nTicket.ticket_number = ticket.ticket_number;
      nTicket.tab_id = ticket.tab_id;

      await transactionalEntityManager.save(nTicket);

      const ticketItems = ticket.items.map((item: ITicketItem) => {
        const ticketItem = new TicketItemEntity();
        ticketItem.name = item.name;
        ticketItem.ticket = nTicket;
        ticketItem.price = item.price;
        ticketItem.quantity = item.quantity;
        ticketItem.ticket_item_id = item.ticket_item_id;
        return ticketItem;
      });

      await transactionalEntityManager.save(ticketItems);
    });

    return ticketRepo.findOne({
      where: {
        location: ticket.location,
        ticket_number: ticket.ticket_number,
      },
      relations: ['items'],
    });
  }
}
