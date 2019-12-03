import { Injectable, Logger, BadRequestException, NotFoundException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { getRepository, getConnection, FindOneOptions, FindConditions, EntityManager } from 'typeorm';
import { TicketUser, Ticket, User, TicketItemUser, TicketItem } from '@tabify/entities';
import { AblyService } from '@tabify/services';
import { TicketUpdates, TicketUserStatus, TicketUserStatusOrder } from '../enums';
import { TicketTotalService } from './ticket-total.service';
import * as currency from 'currency.js';

@Injectable()
export class TicketUserService {
  constructor(private readonly ablyService: AblyService, private readonly ticketTotalService: TicketTotalService) { }

  async getTicketUserByTicketUserId(ticketUserId: number) {
    const ticketUserRepo = await getRepository(TicketUser);
    const ticketUser = await ticketUserRepo.findOneOrFail(ticketUserId);
    return ticketUser;
  }

  /**
   * Adds user to existing database ticket
   */
  async addUserToTicket(ticketId: number, uid: string, sendNotification: boolean) {
    const ticketUserRepo = await getRepository(TicketUser);
    let ticketUser = await ticketUserRepo.findOne({ ticket: { id: ticketId }, user: { uid } }, { relations: ['user', 'user.userDetail'] });

    // The user is not currently on the ticket, so add them and send a notification if necessary
    if (!ticketUser) {
      // User can only be added if all existing users have not yet confirmed
      const ticketUsers = await ticketUserRepo.find({ where: { ticket: ticketId } });
      const allConfirmed = ticketUsers.every(user => TicketUserStatusOrder[user.status!] >= TicketUserStatusOrder[TicketUserStatus.CONFIRMED]);
      if (ticketUsers.length && allConfirmed) {
        throw new ForbiddenException('Sorry, the patrons of this tab have already selected their items and moved on to payment.');
      }

      await ticketUserRepo.insert({ ticket: { id: ticketId }, user: { uid }, status: TicketUserStatus.SELECTING });
      ticketUser = await ticketUserRepo.findOneOrFail({ ticket: { id: ticketId }, user: { uid } }, { relations: ['user', 'user.userDetail'] });
      if (sendNotification) {
        await this.ablyService.publish(TicketUpdates.TICKET_USER_ADDED, ticketUser, ticketId.toString());
      }
    }

    return ticketUser;
  }

  /** Update subtotal, total, and selected items count for this user */
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
      total: Number(priceSum),
      selectedItemsCount: Number(selectedItemsCount),
    };
    await ticketUserRepo.update(updatedTicketUser.id, {
      sub_total: Number(priceSum),
      total: Number(priceSum),
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

  async updateTicketUserStatus(ticketId: number, ticketUserId: number, newUserStatus: TicketUserStatus, sendNotification: boolean) {
    const updatedTicketUser = await getConnection().transaction(async transactionalEntityManager => {
      const ticketUserRepo = await transactionalEntityManager.getRepository(TicketUser);
      const ticketUsers = await ticketUserRepo.find({ where: { ticket: ticketId } });
      // TODO: Check that ticketUsers is correct and that the find condition isn't returning all TicketUsers
      const currentTicketUser = ticketUsers.find(u => u.id === ticketUserId);

      if (!currentTicketUser) {
        throw new InternalServerErrorException('Cannot find the currentTicketUser for status update.');
      }

      if (TicketUserStatusOrder[newUserStatus] < TicketUserStatusOrder[TicketUserStatus.CONFIRMED]
        && ticketUsers.every(user => TicketUserStatusOrder[user.status!] >= TicketUserStatusOrder[TicketUserStatus.CONFIRMED])) {
        throw new BadRequestException('All users have already confirmed, cannot set status to selecting or waiting.');
      }

      if (TicketUserStatusOrder[newUserStatus] < TicketUserStatusOrder[TicketUserStatus.PAYING]
        && ticketUsers.every(user => TicketUserStatusOrder[user.status!] >= TicketUserStatusOrder[TicketUserStatus.PAYING])) {
        throw new BadRequestException('All users are in the process of paying, cannot set status to anything other than paying.');
      }

      if (TicketUserStatusOrder[newUserStatus] < TicketUserStatusOrder[TicketUserStatus.PAID]
        && ticketUsers.every(user => TicketUserStatusOrder[user.status!] >= TicketUserStatusOrder[TicketUserStatus.PAID])) {
        throw new BadRequestException('All users have already paid, cannot set status to anything other than paid.');
      }

      if (newUserStatus === TicketUserStatus.CONFIRMED) {
        const ticketItemRepo = transactionalEntityManager.getRepository(TicketItem);
        const ticketItems = await ticketItemRepo.find({ where: { ticket: ticketId }, relations: ['users'] });
        if (ticketItems.some(item => item.users!.length === 0)) {
          throw new BadRequestException('Cannot confirm selections until all items have been claimed by at least one person.');
        }
      }

      currentTicketUser.status = newUserStatus;
      return await ticketUserRepo.save(currentTicketUser);
    });

    // If we successfully set the user status to CONFIRMED, let's check to see if everyone else has also confirmed
    if (updatedTicketUser.status === TicketUserStatus.CONFIRMED) {
      const updatedTicketUsers = await getConnection().transaction(async transactionalEntityManager => {
        const ticketUserRepo = await transactionalEntityManager.getRepository(TicketUser);
        const ticketUsers = await ticketUserRepo.find({ where: { ticket: ticketId }, relations: ['user'] });

        // If all have confirmed, set everyone's status to PAYING
        if (ticketUsers.every(user => user.status === TicketUserStatus.CONFIRMED)) {
          // Everyone has confirmed! Before setting everyone's status to PAYING,
          // first check if all items are claimed by at least one person
          console.log("IN HERE!");
          const ticketItemRepo = transactionalEntityManager.getRepository(TicketItem);
          const ticketItems = await ticketItemRepo.find({ where: { ticket: ticketId }, relations: ['users', 'users.user'] });
          if (ticketItems.some(item => item.users!.length === 0)) {
            // TODO: Consider setting everyone's status back down to WAITING at this point
            throw new BadRequestException('All users have confirmed, but some items are still unclaimed.');
          }

          // Set everyone's status to PAYING and also verify and finalize the totals.
          const ticketTotal = await this.ticketTotalService.getTicketTotals(ticketId);
          if (!ticketTotal) throw new InternalServerErrorException('Cannot load the ticket totals.');

          const distributedTax = currency(ticketTotal.tax / 100).distribute(ticketUsers.length);
          let allUsersSubtotal = 0;
          let allUsersTax = 0;
          let allUsersTotal = 0;
          ticketUsers.forEach((ticketUser: TicketUser, index: number) => {
            // Find sum of the selected items for this user
            let subtotal = 0;
            ticketItems.forEach((ticketItem) => {
              const userOnItem = ticketItem.users!.find(u => u.user.uid === ticketUser.user!.uid);
              if (userOnItem) {
                subtotal += userOnItem.price;
              }

              let ticketItemUsersSum = 0;
              ticketItem.users!.forEach(u => ticketItemUsersSum += u.price);
              if (ticketItemUsersSum !== ticketItem.price) {
                throw new InternalServerErrorException('The sum of the ticket item users share does not match the item\'s price.');
              }
            });
            // Error checking
            if (subtotal !== ticketUser.sub_total) {
              // TODO: Consider resynchronizing each user's subtotal at this point
              console.error('subtotal', subtotal);
              console.error('ticketUser.sub_total', ticketUser.sub_total);

              throw new InternalServerErrorException('The sum of the user\'s selected items does not match the user\'s subtotal.');
            }

            allUsersSubtotal += ticketUser.sub_total;

            // Distribute the tax evenly
            // TODO: Distribute the tax proportionally
            ticketUser.tax = distributedTax[index].intValue;
            allUsersTax += ticketUser.tax;

            // Set the user total
            ticketUser.total = ticketUser.sub_total + ticketUser.tax;
            allUsersTotal += ticketUser.total;

            // Set the user status to PAYING
            ticketUser.status = TicketUserStatus.PAYING;
          });

          // Account for Omnivore Virtual POS bug that adds a $5 service charge to every ticket
          const ticketRepo = transactionalEntityManager.getRepository(Ticket);
          const ticket = await ticketRepo.findOneOrFail(ticketId, { relations: ['location'] });
          if (ticket.location!.omnivore_id === 'i8yBgkjT') {
            allUsersTotal += 500;
          }

          if (
            allUsersSubtotal !== ticketTotal.sub_total ||
            allUsersTax !== ticketTotal.tax ||
            allUsersTotal !== ticketTotal.total
          ) {
            throw new InternalServerErrorException('The users\' subtotal, tax, or total is not equal to the ticket totals!');
          }

          // Save all ticket users
          const payingTicketUsers = await ticketUserRepo.save(ticketUsers);

          // Remove unnecessary user so that TicketUser override in the frontend is unaffected
          payingTicketUsers.forEach(u => u.user = undefined);
          return payingTicketUsers;
        }
        // Not everyone has confirmed yet, so just return the single updatedTicketUser
        else {
          return [updatedTicketUser];
        }
      });
      if (sendNotification) {
        await this.ablyService.publish(
          TicketUpdates.MULTIPLE_UPDATES,
          [{ name: TicketUpdates.TICKET_USERS_UPDATED, data: updatedTicketUsers }],
          ticketId.toString());
      }
    } else {
      if (sendNotification) {
        await this.ablyService.publish(TicketUpdates.MULTIPLE_UPDATES, [
          { name: TicketUpdates.TICKET_USERS_UPDATED, data: [updatedTicketUser] },
        ], ticketId.toString());
      }

      return updatedTicketUser;
    }
  }
}
