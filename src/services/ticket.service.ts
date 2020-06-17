import { Injectable, Logger, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { getRepository, getConnection, FindOneOptions, FindConditions, InsertResult, MoreThanOrEqual, DeleteResult } from 'typeorm';
import { auth } from 'firebase-admin';
import { FirebaseService, OmnivoreService, UserService, SMSService, ServerService, AblyService } from '@tabify/services';
import {
  Ticket as TicketEntity,
  TicketItem as TicketItemEntity,
  User as UserEntity,
  TicketItem,
  TicketTotal,
} from '@tabify/entities';
import { TicketStatus, TicketUpdates } from '../enums';

@Injectable()
export class TicketService {

  constructor(
    private readonly messageService: SMSService,
    private readonly serverService: ServerService,
    private readonly userService: UserService,
    private readonly ablyService: AblyService,
  ) { }

  /**
   * Attemps to load a ticket from local database if it exists
   */
  async getTicket(
    where: FindConditions<TicketEntity>,
    relations: string[],
  ) {
    const ticket = await getConnection().transaction(async transactionalEntityManager => {
      const ticketRepo = await transactionalEntityManager.getRepository(TicketEntity);
      return await ticketRepo.findOne({
        where,
        relations,
        lock: { mode: 'pessimistic_read' },
      });
    });
    return ticket;
  }

  /**
   * Updates the ticket then returns the ticket object
   * @param ticket
   */
  async updateTicket(ticket: TicketEntity): Promise<TicketEntity> {
    const savedTicket = await getConnection().transaction(async transactionalEntityManager => {
      const ticketRepo = await transactionalEntityManager.getRepository(TicketEntity);
      return await ticketRepo.save(ticket);
    });
    return savedTicket;
  }

  /**
   * Delete a ticket
   * @param ticketId number
   */
  async deleteTicket(ticketId: number): Promise<DeleteResult> {
    const ticketRepo = await getRepository(TicketEntity);
    const deletedTicket = await ticketRepo.delete(ticketId);
    return deletedTicket;
  }

  /**
   * Creates the ticket, returns it if it already exists
   * @param ticket
   */
  async createTicket(ticket: TicketEntity, opened_recently: boolean, relations: string[]) {

    const where: FindConditions<TicketEntity> = {
      location: ticket.location, tab_id: ticket.tab_id,
      ticket_number: ticket.ticket_number, ticket_status: TicketStatus.OPEN,
    };

    // see if a ticket was created in the last 6 hours
    if (opened_recently) {
      const date = new Date();
      date.setUTCHours(date.getUTCHours() - 6);
      where.date_created = MoreThanOrEqual(date);
    }

    const ticketFindOptions = {
      where,
      relations,
      lock: { mode: 'pessimistic_write' },
    };

    return await getConnection().transaction(async transactionalEntityManager => {
      const ticketRepo = await transactionalEntityManager.getRepository(TicketEntity);
      let existingTicket = await ticketRepo.findOne(ticketFindOptions as FindOneOptions<TicketEntity>);

      // The ticket already exists, return it
      if (existingTicket) {
        Logger.log('The ticket already exists, return it');
        return { created: false, ticket: existingTicket };
      }
      // Create the ticket
      else {
        Logger.log('Need to Create the ticket');
        let insertedTicketId: number;
        try {
          // This will block if multiple transactions try to insert
          Logger.log('Inserting the ticket');
          const insertedTicketResult = await ticketRepo.insert(ticket);
          const { identifiers: [insertResult] } = insertedTicketResult;
          insertedTicketId = insertResult.id;
          Logger.log(insertedTicketResult, 'Inserted the ticket');
        } catch (e) {
          // Somebody beat us at the race
          Logger.error(e, 'RACE CONDITION!');
          existingTicket = await ticketRepo.findOneOrFail(ticketFindOptions as FindOneOptions<TicketEntity>);
          return { created: false, ticket: existingTicket };
        }

        if (isNaN(insertedTicketId)) throw new InternalServerErrorException('An error occurred while inserting the ticket.');

         // Add items to ticket
        const ticketItemsRepo = await transactionalEntityManager.getRepository(TicketItem);
        if (ticket.items) {
           await ticketItemsRepo.insert(ticket.items.map(item => ({ ...item, ticket: insertedTicketId as TicketEntity })));
         }

        // Add totals to ticket
        const ticketTotalRepo = await transactionalEntityManager.getRepository(TicketTotal);
        await ticketTotalRepo.insert({ ...ticket.ticketTotal!, ticket: insertedTicketId as TicketEntity });

        // Retrieve and join this new ticket
        Logger.log('Retrieving the created ticket');
        existingTicket = await ticketRepo.findOneOrFail(ticketFindOptions as FindOneOptions<TicketEntity>);
        Logger.log(existingTicket, 'Retrieved the created ticket');

        // upon creation of ticket, send an SMS to the server that users will be using Tabify for this ticket
        if (existingTicket.server && existingTicket.server.phone) {
          const ticketNumber = existingTicket.ticket_number;
          const server = existingTicket.server;
          const tableName = existingTicket.table_name;
          const section1 = `Ticket #${ticketNumber} will be paying with Tabify.`;
          const section2 = tableName ? ` Table/Revenue Center: ${tableName}.` : '';
          const section3 = server ? ` Server: ${server.firstName}.` : '';
          const textMsg = section1 + section2 + section3;

          this.messageService.sendSMS(server.phone, textMsg);
        }

        return { created: true, ticket: existingTicket };
      }
    });
  }

  /**
   * update the status of a ticket to 'false', which means the ticket has been closed
   * @param ticketId
   */
  async closeTicket(ticketId: number) {

    // add server rewards for new users referrals
    await this.serverService.addServerReward(ticketId);

    const res = await getConnection()
      .createQueryBuilder()
      .update(TicketEntity)
      .set({ ticket_status: TicketStatus.CLOSED })
      .where('id = :id', { id: ticketId })
      .execute();

    // set newUser status to false on users completing their first ticket
    await this.userService.setNewUsersFalse(ticketId);

    await this.serverService.sendTicketCloseSMSToServer(ticketId);

    await this.ablyService.publish(TicketUpdates.TICKET_UPDATED, { ticket_status: TicketStatus.CLOSED }, ticketId.toString());

    return res;
  }

  async getTicketFirestoreId(id: number) {
    const ticketRepo = await getRepository(TicketEntity);
    const ticket = await ticketRepo.findOne({ id });
    if (!ticket) {
      throw new NotFoundException(`Ticket with id ${id} could not be found`);
    }
    // if (!ticket.firestore_doc_id) {
    //   throw new NotFoundException(`Ticket with id ${id} does not have an associated Firestore Document Id`);
    // }
    // return ticket.firestore_doc_id;
  }
}
