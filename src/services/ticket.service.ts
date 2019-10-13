import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { getRepository, getConnection, FindOneOptions, FindConditions } from 'typeorm';
import { auth } from 'firebase-admin';
import { FirebaseService, OmnivoreService, StoryService } from '@tabify/services';
import {
  ITicketItem,
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
  ) { }

  /**
   * Attemps to load a ticket from local database if it exists
   */
  async getTicket(
    where: FindConditions<TicketEntity>,
    relations: string[] = ['items', 'location', 'users'],
  ) {
    const ticketRepo = await getRepository(TicketEntity);
    const ticket = await ticketRepo.findOne({
      where,
      relations,
    });

    return ticket;
  }

  /**
   * Creates the ticket then returns the ticket object
   * @param ticket
   */
  async createTicket(ticket: TicketEntity): Promise<TicketEntity> {
    const ticketRepo = await getRepository(TicketEntity);
    return await ticketRepo.save(ticket);
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
   * Add user to existing database ticket
   */
  async addUserToDatabaseTicket(ticketId: number, uid: string) {
    try {
      await getConnection()
        .createQueryBuilder()
        .relation(TicketEntity, 'users')
        .of(ticketId)
        .add(uid);
    } catch (e) {
      const { code } = e;
      if (code !== 'ER_DUP_ENTRY') {
        throw new BadRequestException('An unknown error occurred. Please try again.', e);
      }
    }
  }
}
