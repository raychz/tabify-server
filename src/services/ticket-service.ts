import { Injectable, Logger } from '@nestjs/common';
import { OmnivoreService } from '../services/omnivore.service';
import { getManager, getRepository, EntityManager } from 'typeorm';
import {
  Location as LocationEntity,
  Ticket as TicketEntity,
  User as UserEntity,
  User,
} from '../entity';
import { ITicket, Ticket } from '../entity/ticket.entity';
import {
  TicketItem as TicketItemEntity,
  ITicketItem,
} from '../entity/ticket-item.entity';
import { FirebaseService } from './firebase.service';
import { auth } from 'firebase-admin';
import { StoryService } from './story.service';

@Injectable()
export class TicketService {
  constructor(
    private readonly omnivoreService: OmnivoreService,
    private readonly firebaseService: FirebaseService,
    private storyService: StoryService,
  ) {}

  /**
   * Attemps to load a ticket from local database if exists,
   * if not, fetch it from omnivore, add it to our database, then return ticket.
   *
   * This function also creates a new story, to be associated with a new ticket
   */
  async getTicket(
    omnivoreLocationId: string,
    ticket_number: string,
    user: auth.UserRecord,
  ) {
    const ticketRepo = await getRepository(TicketEntity);
    const ticket = await ticketRepo.findOne({
      where: { locationId: omnivoreLocationId, ticket_number },
      relations: ['items', 'location', 'users'],
    });

    if (ticket) {
      await this.firebaseService.addUserToFirestoreTicket(ticket, user);
      return ticket;
    } else {
      try {
        const ticketObj = await this.omnivoreService.getTicket(
          omnivoreLocationId,
          ticket_number,
        );
        const newTicket = await this.saveTicket(ticketObj, user.uid);

        // Save new story
        await this.storyService.saveStory(newTicket);

        await this.firebaseService.addTicketToFirestore(newTicket);
        await this.firebaseService.addUserToFirestoreTicket(newTicket, user);
        return newTicket;
      } catch (error) {
        Logger.error(error.message);
      }
    }
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
   * Add user to existing ticket
   */
  // async addUserToTicket(ticket: ITicket): Promise<TicketEntity> {

  // }
}
