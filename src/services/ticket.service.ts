import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepository, getConnection, FindOneOptions, FindConditions } from 'typeorm';
import { auth } from 'firebase-admin';
import { FirebaseService, OmnivoreService, StoryService } from '@tabify/services';
import {
  ITicketItem,
  Ticket as TicketEntity,
  TicketItem as TicketItemEntity,
  User as UserEntity,
  TicketStatus,
  TicketUser,
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
    relations: string[],
  ) {
    const ticketRepo = await getRepository(TicketEntity);
    const ticket = await ticketRepo.findOne({
      where,
      relations,
    });

    return ticket;
  }

  /**
   * Creates/Updates the ticket then returns the ticket object
   * @param ticket
   */
  async saveTicket(ticket: TicketEntity): Promise<TicketEntity> {
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

  async getTicketFirestoreId(id: number) {
    const ticketRepo = await getRepository(TicketEntity);
    const ticket = await ticketRepo.findOne({ id });
    if (!ticket) {
      throw new NotFoundException(`Ticket with id ${id} could not be found`);
    }
    if (!ticket.firestore_doc_id) {
      throw new NotFoundException(`Ticket with id ${id} does not have an associated Firestore Document Id`);
    }
    return ticket.firestore_doc_id;
  }

  /**
   * Add user to existing database ticket
   */
  async addUserToDatabaseTicket(ticketId: number, uid: string) {
    const ticketUserRepo = await getRepository(TicketUser);
    const ticketUser = await ticketUserRepo.findOne({ ticket: { id: ticketId }, user: { uid } });
    if (!ticketUser) {
      return await ticketUserRepo.save({ ticket: { id: ticketId }, user: { uid } });
    }
    return ticketUser;
  }
}
