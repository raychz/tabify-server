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
    let ticketUser = await ticketUserRepo.findOne({ ticket: { id: ticketId }, user: { uid } }, { relations: ['user', 'user.userDetail'] });

    if (!ticketUser) {
      await ticketUserRepo.insert({ ticket: { id: ticketId }, user: { uid } });
      ticketUser = await ticketUserRepo.findOneOrFail({ ticket: { id: ticketId }, user: { uid } }, { relations: ['user', 'user.userDetail'] });
    }

    return ticketUser;
  }
}
