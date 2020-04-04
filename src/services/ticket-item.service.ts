import { Injectable, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { getRepository, getConnection, EntityManager, In } from 'typeorm';
import { TicketItemUser, TicketItem, User, TicketUser, Ticket } from '@tabify/entities';
import { AblyService, TicketUserService, UserService } from '@tabify/services';
import * as currency from 'currency.js';
import { TicketUpdates, TicketUserStatus } from '../enums';
import { retry, AttemptContext, PartialAttemptOptions } from '@lifeomic/attempt';

@Injectable()
export class TicketItemService {
  retryOptions: PartialAttemptOptions<any> = {
    delay: 500,
    factor: 2,
    maxAttempts: 5,
    minDelay: 250,
    maxDelay: 5000,
    jitter: true,
  };

  constructor(private ticketUserService: TicketUserService, private readonly ablyService: AblyService, private userService: UserService) { }

  async addUserToTicketItem(uid: string, ticketUserId: number, itemId: number, ticketId: number, sendNotification: boolean) {
    const ticketUser = await this.ticketUserService.getTicketUserByTicketUserId(ticketUserId);
    if (ticketUser.status !== TicketUserStatus.SELECTING) {
      throw new BadRequestException(`This user cannot modify their selections because their status is ${ticketUser.status}, not ${TicketUserStatus.SELECTING}. Please try again or refresh the app.`);
    }

    const updatedTicketItemUsers: TicketItemUser[] = await retry(
      async (context: AttemptContext, options) => {
        if (context.attemptNum !== 0) {
          Logger.error(
            `A failure occurred. Making attempt #${context.attemptNum + 1} of adding user to ticket item.
            Attempts remaining: ${context.attemptsRemaining}.`,
            undefined,
            'addUserToTicketItem:updatedTicketItemUsers',
            true,
          );
        }
        return await getConnection().transaction(async transactionalEntityManager => {
          // Get existing users for this ticket item and lock the rows for update using pessimistic_write
          const ticketItemUsers = await this.ticketUserService.getTicketItemUsers(itemId, transactionalEntityManager);

          // Check if the current user has already claimed this item
          const hasCurrentUser = ticketItemUsers.find(ticketItemUser => ticketItemUser.user.uid === uid);
          if (hasCurrentUser) {
            throw new BadRequestException('This item has already been added to your tab.');
          }

          // Get associated ticket item
          const ticketItem = await this.getTicketItem(itemId, transactionalEntityManager);

          // Add current user to array of ticket item users
          const partialNewTicketItemUser: Omit<TicketItemUser, 'id'> = { ticketItem: { id: ticketItem.id }, user: await this.userService.getUser(uid), price: 0 };
          const newTicketItemUser = partialNewTicketItemUser as TicketItemUser;
          ticketItemUsers.push(newTicketItemUser);

          // Evenly distribute the cost of the item amongst the ticket item users
          this.distributeItemPrice(ticketItem.price!, ticketItemUsers);

          // Insert new ticket item user
          const ticketItemUserRepo = await transactionalEntityManager.getRepository(TicketItemUser);
          const { identifiers: [inserted] } = await ticketItemUserRepo.insert(newTicketItemUser);
          newTicketItemUser.id = inserted.id;

          // Update price of all ticket item users, EXCEPT for the newly created one, which was inserted above
          if (ticketItemUsers.length > 1) {
            const ticketItemUsersToUpdate = ticketItemUsers.slice(0, -1);
            await Promise.all(ticketItemUsersToUpdate.map(u => ticketItemUserRepo.update(u.id!, { price: u.price })));
          }
          return ticketItemUsers;
        });
      }, this.retryOptions);

    const updatedTicketUsers: TicketUser[] = await retry(
      async (context: AttemptContext, options) => {
        if (context.attemptNum !== 0) {
          Logger.error(
            `A failure occurred. Making attempt #${context.attemptNum + 1} of updating ticket users after adding user to ticket item..
            Attempts remaining: ${context.attemptsRemaining}.`,
            undefined,
            'addUserToTicketItem:updatedTicketUsers',
            true,
          );
        }
        return await getConnection().transaction(async transactionalEntityManager => {
          // Update subtotals for each user on this item;
          // get their items and get their TicketUser entity and update the price to be the sum of the items
          const ticketUsers = [];
          for (const updatedTicketItemUser of updatedTicketItemUsers) {
            const updatedTicketUser = await this.ticketUserService.updateTicketUserTotals(
              ticketId,
              updatedTicketItemUser.user.uid,
              transactionalEntityManager,
            );
            ticketUsers.push(updatedTicketUser);
          }
          return ticketUsers;
        });
      }, this.retryOptions);

    if (sendNotification) {
      await this.ablyService.publish(TicketUpdates.MULTIPLE_UPDATES, [
        { name: TicketUpdates.TICKET_ITEM_USERS_REPLACED, data: { newTicketItemUsers: updatedTicketItemUsers, itemId } },
        { name: TicketUpdates.TICKET_USERS_UPDATED, data: updatedTicketUsers },
      ], ticketId.toString());
    }
    return { updatedTicketItemUsers, updatedTicketUsers };
  }

  async removeUserFromTicketItem(uid: string, ticketUserId: number, itemId: number, ticketId: number, sendNotification: boolean) {
    const ticketUser = await this.ticketUserService.getTicketUserByTicketUserId(ticketUserId);
    if (ticketUser.status !== TicketUserStatus.SELECTING) {
      throw new BadRequestException(`This user cannot modify their selections because their status is ${ticketUser.status}, not ${TicketUserStatus.SELECTING}. Please try again or refresh the app.`);
    }

    const result: { updatedTicketItemUsers: TicketItemUser[], usersAffected: TicketItemUser[] } = await retry(
      async (context: AttemptContext, options) => {
        if (context.attemptNum !== 0) {
          Logger.error(
            `A failure occurred. Making attempt #${context.attemptNum + 1} of updating ticket users after removing user from ticket item.
          Attempts remaining: ${context.attemptsRemaining}.`,
            undefined,
            'removeUserFromTicketItem:updatedTicketItemUsers',
            true,
          );
        }
        return await getConnection().transaction(async transactionalEntityManager => {
          // Get existing users for this ticket item and lock the rows for update using pessimistic_write
          const ticketItemUsers = await this.ticketUserService.getTicketItemUsers(itemId, transactionalEntityManager);

          // Check if the current user has already unclaimed this item
          const hasCurrentUser = ticketItemUsers.find(ticketItemUser => ticketItemUser.user.uid === uid);
          if (!hasCurrentUser) {
            throw new BadRequestException('This item has already been removed from your tab.');
          }

          // Get associated ticket item
          const ticketItem = await this.getTicketItem(itemId, transactionalEntityManager);

          // Remove current user from array of ticket item users
          const userIndex = ticketItemUsers.findIndex(ticketItemUser => ticketItemUser.user.uid === uid);
          const removedTicketItemUser = ticketItemUsers.splice(userIndex, 1)[0];

          // Evenly distribute the cost of the item amongst the ticket item users
          this.distributeItemPrice(ticketItem.price!, ticketItemUsers);

          // Remove ticket item user
          const ticketItemUserRepo = await transactionalEntityManager.getRepository(TicketItemUser);
          await ticketItemUserRepo.delete(removedTicketItemUser.id!);

          // Update price of all remaining ticket item users
          if (ticketItemUsers.length) {
            await Promise.all(ticketItemUsers.map(u => ticketItemUserRepo.update(u.id!, { price: u.price })));
          }

          // Push the removed user so that it gets included in the subtotals update below
          const usersAffected: TicketItemUser[] = [...ticketItemUsers, removedTicketItemUser];

          return { updatedTicketItemUsers: ticketItemUsers, usersAffected };
        });
      });

    const updatedTicketUsers: TicketUser[] = await retry(
      async (context: AttemptContext, options) => {
        if (context.attemptNum !== 0) {
          Logger.error(
            `A failure occurred. Making attempt #${context.attemptNum + 1} of updating ticket users after removing user from ticket item.
            Attempts remaining: ${context.attemptsRemaining}.`,
            undefined,
            'removeUserFromTicketItem:updatedTicketUsers',
            true,
          );
        }
        return await getConnection().transaction(async transactionalEntityManager => {
          // Update subtotals for each user on this item;
          // get their items and get their TicketUser entity and update the price to be the sum of the items
          const ticketUsers = [];
          for (const updatedTicketItemUser of result.usersAffected) {
            const updatedTicketUser = await this.ticketUserService.updateTicketUserTotals(
              ticketId,
              updatedTicketItemUser.user.uid,
              transactionalEntityManager,
            );
            ticketUsers.push(updatedTicketUser);
          }
          return ticketUsers;
        });
      }, this.retryOptions);

    if (sendNotification) {
      await this.ablyService.publish(TicketUpdates.MULTIPLE_UPDATES, [
        { name: TicketUpdates.TICKET_ITEM_USERS_REPLACED, data: { newTicketItemUsers: result.updatedTicketItemUsers, itemId } },
        { name: TicketUpdates.TICKET_USERS_UPDATED, data: updatedTicketUsers },
      ], ticketId.toString());
    }
    return { updatedTicketItemUsers: result.updatedTicketItemUsers, updatedTicketUsers };
  }

  async getTicketItem(itemId: number, manager: EntityManager) {
    const ticketItemRepo = manager.getRepository(TicketItem);

    return await ticketItemRepo.findOneOrFail({
      where: { id: itemId },
      // lock: { mode: 'pessimistic_read' }, // TODO: Revert back to pess read?
    });
  }

  async getTicketItems(ticketId: number, manager: EntityManager) {
    const ticketItemRepo = manager.getRepository(TicketItem);
    return ticketItemRepo.find({ where: { ticket: ticketId }, relations: ['users'] });
  }

  /** get ticket items for a user, for a ticket */
  async getTicketItemsForUser(ticketId: number, uid: string) {
    const ticketItemRepo = await getRepository(TicketItem);
    const items = await ticketItemRepo.createQueryBuilder('ticketItem')
      .innerJoinAndSelect('ticketItem.users', 'ticketItemUsers')
      .innerJoinAndSelect('ticketItemUsers.user', 'ticketItemsUsersUser', 'ticketItemsUsersUser.uid = :uid', { uid })
      .where('ticketItem.ticket = :ticketId', { ticketId })
      .getMany();

    return items;
  }

  /** Distributes the cost of an item evenly amongst ticket item users */
  private distributeItemPrice(price: number, ticketItemUsers: TicketItemUser[]) {
    currency(price / 100)
      .distribute(ticketItemUsers.length)
      .forEach((d, index) => ticketItemUsers[index].price = d.intValue);
  }
}
