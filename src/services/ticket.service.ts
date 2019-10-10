import { Injectable, Logger } from '@nestjs/common';
import { getRepository, getConnection } from 'typeorm';
import { auth } from 'firebase-admin';
import { FirebaseService, OmnivoreService, StoryService } from '@tabify/services';
import {
  ITicketItem,
  ITicket,
  Ticket as TicketEntity,
  TicketItem as TicketItemEntity,
  User as UserEntity,
  TicketStatus,
} from '@tabify/entities';

@Injectable()
export class TicketService {
  constructor(
    private readonly omnivoreService: OmnivoreService,
    private readonly firebaseService: FirebaseService,
    private storyService: StoryService,
  ) { }

  /**
   * Attemps to load a ticket from local database if exists,
   * if not, fetch it from omnivore, add it to our database, then return ticket.
   *
   * This function also creates a new story, to be associated with a new ticket
   */
  async getTicket(
    omnivoreLocationId: string,
    ticket_number: string,
  ) {
    const ticketRepo = await getRepository(TicketEntity);
    const ticket = await ticketRepo.findOne({
      where: { locationId: omnivoreLocationId, ticket_number },
      relations: ['items', 'location', 'users'],
    });

    return ticket;
  }

  /**
   * Saves the ticket then return the ticket object
   * @param ticket
   */
  async saveTicket(ticket: ITicket, uid: string): Promise<TicketEntity> {
    const ticketRepo = await getRepository(TicketEntity);

    // Add current user to ticket
    const user = new UserEntity();
    user.uid = uid;

    const nTicket = new TicketEntity();
    nTicket.users = [user];
    nTicket.location = ticket.location;
    nTicket.ticket_number = ticket.ticket_number;
    nTicket.tab_id = ticket.tab_id;
    nTicket.ticket_status = TicketStatus.OPEN;

    const ticketItems = ticket.items.map((item: ITicketItem) => {
      const ticketItem = new TicketItemEntity();
      ticketItem.name = item.name;
      // ticketItem.ticket = nTicket;
      ticketItem.price = item.price;
      ticketItem.quantity = item.quantity;
      ticketItem.ticket_item_id = item.ticket_item_id;
      return ticketItem;
    });
    nTicket.items = ticketItems;
    return await ticketRepo.save(nTicket);
  }

  /**
   * update the status of a ticket to 'false', which means the ticket has been closed
   * @param ticketId
   */
  async closeTicket(ticketId: number) {
    const res = await getConnection()
      .createQueryBuilder()
      .update(TicketEntity)
      .set({ ticket_status: TicketStatus.CLOSED })
      .where('id = :id', { id: ticketId })
      .execute();

    return res;
  }

  /**
   * Add user to existing ticket
   */
  // async addUserToTicket(ticket: ITicket): Promise<TicketEntity> {

  // }
}
