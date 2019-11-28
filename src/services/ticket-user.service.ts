import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepository, getConnection, FindOneOptions, FindConditions, EntityManager } from 'typeorm';
import { TicketUser, Ticket, User, TicketItemUser } from '@tabify/entities';
import { AblyService } from '@tabify/services';
import { TicketUpdates } from '../enums';

@Injectable()
export class TicketUserService {
  constructor(private readonly ablyService: AblyService) { }

  /**
   * Adds user to existing database ticket
   */
  async addUserToTicket(ticketId: number, uid: string, sendNotification: boolean) {
    const ticketUserRepo = await getRepository(TicketUser);
    let ticketUser = await ticketUserRepo.findOne({ ticket: { id: ticketId }, user: { uid } }, { relations: ['user', 'user.userDetail'] });

    // The user is not currently on the ticket, so add them and send a notification if necessary
    if (!ticketUser) {
      await ticketUserRepo.insert({ ticket: { id: ticketId }, user: { uid } });
      ticketUser = await ticketUserRepo.findOneOrFail({ ticket: { id: ticketId }, user: { uid } }, { relations: ['user', 'user.userDetail'] });
      if (sendNotification) {
        await this.ablyService.publish(TicketUpdates.TICKET_USER_ADDED, ticketUser, ticketId.toString());
      }
    }

    return ticketUser;
  }

  /** Update subtotal and selected items count for this user */
  async updateTicketUserTotals(ticketId: number, uid: string, manager: EntityManager) {
    const ticketUserRepo = await manager.getRepository(TicketUser);
    const ticketItemUserRepo = await manager.getRepository(TicketItemUser);

    const ticketUser = await ticketUserRepo.findOneOrFail({
      where: { ticket: ticketId, user: uid },
      // lock: { mode: 'pessimistic_write' }, // TODO: Change back to pess write?
    });

    const { priceSum, selectedItemsCount } = await ticketItemUserRepo
      .createQueryBuilder('ticketItemUser')
      // .setLock('pessimistic_read') // TODO: Change back to pess read?
      .select('SUM(ticketItemUser.price)', 'priceSum')
      .addSelect('COUNT(*)', 'selectedItemsCount')
      .leftJoin('ticketItemUser.ticketItem', 'ticketItem')
      .where('ticketItemUser.user = :uid', { uid })
      .andWhere('ticketItem.ticket = :ticketId', { ticketId })
      .getRawOne();

    const updatedTicketUser: TicketUser = {
      ...ticketUser,
      sub_total: Number(priceSum),
      selectedItemsCount: Number(selectedItemsCount),
    };
    await ticketUserRepo.update(updatedTicketUser.id, {
      sub_total: Number(priceSum),
      selectedItemsCount: Number(selectedItemsCount),
    });
    return updatedTicketUser;
  }

  /** Get users for this ticket item */
  async getTicketItemUsers(itemId: number, manager: EntityManager) {
    const ticketItemUserRepo = await manager.getRepository(TicketItemUser);
    const ticketItemUsers = await ticketItemUserRepo.find({
      where: { ticketItem: itemId },
      relations: ['user', 'user.userDetail'],
      lock: { mode: 'pessimistic_write' },
    });
    return ticketItemUsers;
  }
}
