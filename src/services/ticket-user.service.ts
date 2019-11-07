import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepository, getConnection, FindOneOptions, FindConditions } from 'typeorm';
import { TicketUser } from '@tabify/entities';

@Injectable()
export class TicketUserService {
  /**
   * Adds user to existing database ticket
   */
  async addUserToTicket(ticketId: number, uid: string) {
    const ticketUserRepo = await getRepository(TicketUser);
    const ticketUser = await ticketUserRepo.findOne({ ticket: { id: ticketId }, user: { uid } });
    if (!ticketUser) {
      return await ticketUserRepo.save({ ticket: { id: ticketId }, user: { uid } });
    }
    return ticketUser;
  }
}