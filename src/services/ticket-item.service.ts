import { Injectable, ConflictException, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { getRepository, getConnection, EntityManager, In } from 'typeorm';
import { TicketItemUser, TicketItem, User, TicketUser, Ticket } from '@tabify/entities';
import { AblyService, TicketUserService, UserService } from '@tabify/services';
import * as currency from 'currency.js';
import { TicketUpdates, TicketUserStatus } from '../enums';
import { retry, AttemptContext, PartialAttemptOptions } from '@lifeomic/attempt';
import { concatSets } from '../utilities/general.utilities';
import { ItemIdToTicketItemUsersSet } from 'interfaces/ItemIdToTicketItemUsersSet';
import { ItemIdToTicketItemUsersArray } from 'interfaces/ItemIdToTicketItemUsersArray';
import { TicketService } from './ticket.service';

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

  constructor(
    private ticketUserService: TicketUserService,
    private readonly ablyService: AblyService,
    private userService: UserService,
    private ticketService: TicketService,
  ) { }

  async addUserToTicketItems(uid: string, ticketUserId: number, itemIds: number[], ticketId: number, sendNotification: boolean) {
    const ticketUser = await this.ticketUserService.getTicketUserByTicketUserId(ticketUserId);

    // using a map of itemIds to (arrays of) ticketItemUsers to track which users are part of items
    const updatedTicketItemUsersMap: ItemIdToTicketItemUsersSet = {};

    // uids of all the users affected by adding/removing items
    let uidsAffectedAll: Set<string> = new Set();

    if (ticketUser.status !== TicketUserStatus.SELECTING) {
      throw new BadRequestException(`This user cannot modify their selections because their status is ${ticketUser.status},
       not ${TicketUserStatus.SELECTING}. Please try again or refresh the app.`);
    }

    // TODO: get ticket items. Put them in a map. And then get item below. Map (ItemId to TicketItem)

    for (const itemId of itemIds) {
      await retry(
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
            const newTicketItemUser: TicketItemUser = { ticketItem: { id: ticketItem.id }, user: await this.userService.getUser(uid), price: 0 };
            ticketItemUsers.push(newTicketItemUser);

            if (!updatedTicketItemUsersMap[itemId]) {
              updatedTicketItemUsersMap[itemId] = new Set();
              concatSets(updatedTicketItemUsersMap[itemId], new Set(ticketItemUsers));
            } else {
              concatSets(updatedTicketItemUsersMap[itemId], new Set(ticketItemUsers));
            }

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

            // Push the new user so that it gets included in the subtotals update below
            const uidsAffected: Set<string> = new Set(ticketItemUsers.map(tiu => tiu.user.uid));
            uidsAffectedAll = new Set([...uidsAffectedAll, ...uidsAffected]);
          });
        }, this.retryOptions);
    }

    const updatedTicketUsers: TicketUser[] = await retry(
      async (context: AttemptContext, options) => {
        if (context.attemptNum !== 0) {
          Logger.error(
            `A failure occurred. Making attempt ${context.attemptNum + 1} of updating ticket users after adding user to ticket item..
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
          for (const uidAffected of uidsAffectedAll) {
            const updatedTicketUser = await this.ticketUserService.updateTicketUserTotals(
              ticketId,
              uidAffected,
              transactionalEntityManager,
            );
            ticketUsers.push(updatedTicketUser);
          }
          return ticketUsers;
        });
      }, this.retryOptions);

    // convert sets to arrays
    const newTicketItemUsers: ItemIdToTicketItemUsersArray = {};
    // tslint:disable-next-line: forin
    for (const itemId in updatedTicketItemUsersMap) {
      newTicketItemUsers[Number(itemId)] = Array.from(updatedTicketItemUsersMap[itemId]);
    }
    if (sendNotification) {
      await this.ablyService.publish(TicketUpdates.MULTIPLE_UPDATES, [
        { name: TicketUpdates.TICKET_ITEM_USERS_REPLACED, data: { newTicketItemUsers } },
        { name: TicketUpdates.TICKET_USERS_UPDATED, data: updatedTicketUsers },
      ], ticketId.toString());
    }

    return { updatedTicketItemUsers: updatedTicketItemUsersMap, updatedTicketUsers };
  }

  /**
   * removes user from items (itemIds is an array)
   */
  async removeUserFromTicketItems(uid: string, ticketUserId: number, itemIds: number[], ticketId: number, sendNotification: boolean) {
    const ticketUser = await this.ticketUserService.getTicketUserByTicketUserId(ticketUserId);

    // using a map of itemIds to (arrays of) ticketItemUsers to track which users are part of items
    const updatedTicketItemUsersMap: ItemIdToTicketItemUsersSet = {};

    // uids of all the users affected by adding/removing items
    let uidsAffectedAll: Set<string> = new Set();

    if (ticketUser.status !== TicketUserStatus.SELECTING) {
      throw new BadRequestException(`This user cannot modify their selections because their status is ${ticketUser.status},
      not ${TicketUserStatus.SELECTING}. Please try again or refresh the app.`);
    }

    // use set of users usersAffected
    for (const itemId of itemIds) {
      await retry(
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
            // TODO: check if user has already unclaimed ALL the items. if unclaimed, pass. If none left, exit
            const hasCurrentUser = ticketItemUsers.find(ticketItemUser => ticketItemUser.user.uid === uid);
            if (!hasCurrentUser) {
              throw new BadRequestException('This item has already been removed from your tab.');
            }

            // Get associated ticket item
            const ticketItem = await this.getTicketItem(itemId, transactionalEntityManager);

            // Push the user to be removed so that it gets included in the subtotals update below
            const uidsAffected: Set<string> = new Set(ticketItemUsers.map(tiu => tiu.user.uid));
            uidsAffectedAll = new Set([...uidsAffectedAll, ...uidsAffected]);

            // Remove current user from array of ticket item users
            const userIndex = ticketItemUsers.findIndex(ticketItemUser => ticketItemUser.user.uid === uid);
            const removedTicketItemUser = ticketItemUsers.splice(userIndex, 1)[0];

            if (!updatedTicketItemUsersMap[itemId]) {
              updatedTicketItemUsersMap[itemId] = new Set();
            }
            concatSets(updatedTicketItemUsersMap[itemId], new Set(ticketItemUsers));

            // Evenly distribute the cost of the item amongst the ticket item users
            this.distributeItemPrice(ticketItem.price!, ticketItemUsers);

            // Remove ticket item user
            const ticketItemUserRepo = await transactionalEntityManager.getRepository(TicketItemUser);
            await ticketItemUserRepo.delete(removedTicketItemUser.id!);

            // Update price of all remaining ticket item users
            if (ticketItemUsers.length) {
              await Promise.all(ticketItemUsers.map(u => ticketItemUserRepo.update(u.id!, { price: u.price })));
            }

            return;
          });
        }, this.retryOptions);
    }

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
          for (const uidAffected of uidsAffectedAll) {
            const updatedTicketUser = await this.ticketUserService.updateTicketUserTotals(
              ticketId,
              uidAffected,
              transactionalEntityManager,
            );
            ticketUsers.push(updatedTicketUser);
          }
          return ticketUsers;
        });
      }, this.retryOptions);

    // convert sets to arrays
    const newTicketItemUsers: ItemIdToTicketItemUsersArray = {};
    // tslint:disable-next-line: forin
    for (const itemId in updatedTicketItemUsersMap) {
      newTicketItemUsers[Number(itemId)] = Array.from(updatedTicketItemUsersMap[itemId]);
    }
    if (sendNotification) {
      await this.ablyService.publish(TicketUpdates.MULTIPLE_UPDATES, [
        { name: TicketUpdates.TICKET_ITEM_USERS_REPLACED, data: { newTicketItemUsers } },
        { name: TicketUpdates.TICKET_USERS_UPDATED, data: updatedTicketUsers },
      ], ticketId.toString());
    }

    return { updatedTicketItemUsers: updatedTicketItemUsersMap, updatedTicketUsers };
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

  async getTicketItemsByItemIds(itemIds: number[]) {
    const ticketItemRepo = await getRepository(TicketItem);
    return await ticketItemRepo.createQueryBuilder('ticketItem')
      .where('ticketItem.id IN (:...itemIds', { itemIds })
      .getMany();
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

  /**
   * Removes a user from a database ticket, and removes the user from all items of the ticket that
   * they were a part of
   */
  async removeUserFromTicket(ticketId: number, uid: string, sendNotification: boolean) {
    const ticketUserRepo = await getRepository(TicketUser);
    const ticketUser = await ticketUserRepo.findOne({ ticket: { id: ticketId }, user: { uid } }, { relations: ['user', 'user.userDetail'] });

    // The user is currently on the ticket, so remove them and send a notification if necessary
    if (ticketUser) {
      // get all ticket items that the user is part of
      const ticketItemRepo = await getRepository(TicketItem);
      const items = await ticketItemRepo.createQueryBuilder('ticketItem')
        .innerJoin('ticketItem.users', 'ticketUser', 'ticketUser.user = :uid', { uid })
        .where('ticketItem.ticket = :ticketId', { ticketId })
        .getMany();

      // remove user from all ticket items that they had selected on this ticket

      // get only the Ids of each item
      const itemIds: number[] = items.map(item => Number(item.id));

      await this.removeUserFromTicketItems(uid, ticketUser.id, itemIds, ticketId, true);

      try {
        await ticketUserRepo.delete({ ticket: { id: ticketId }, user: { uid } });
        if (sendNotification) {
          await this.ablyService.publish(TicketUpdates.TICKET_USER_REMOVED, ticketUser, ticketId.toString());
        }
      } catch (e) {
        throw new InternalServerErrorException('An error occured while deleting ticket user from DB.');
      }

      // if no more ticket users left for this ticket, delete the ticket
      const ticketUsers = await this.ticketUserService.getTicketUsers(ticketId);
      if (ticketUsers.length === 0) {
        await this.ticketService.deleteTicket(ticketId);
      }
    }

    return ticketUser;
  }

  /**
   * Removes a user from a all itmes on a ticket
   */
  async removeUserFromAllTicketItems(ticketId: number, uid: string, sendNotification: boolean) {
    const ticketUserRepo = await getRepository(TicketUser);
    const ticketUser = await ticketUserRepo.findOne({ ticket: { id: ticketId }, user: { uid } }, { relations: ['user', 'user.userDetail'] });

    if (ticketUser) {
      // get all ticket items that the user is part of
      const ticketItemRepo = await getRepository(TicketItem);
      const items = await ticketItemRepo.createQueryBuilder('ticketItem')
        .innerJoin('ticketItem.users', 'ticketItemUser', 'ticketItemUser.user = :uid', { uid })
        .where('ticketItem.ticket = :ticketId', { ticketId })
        .getMany();

      // get only the Ids of each item
      const itemIds: number[] = items.map(item => Number(item.id));

      await this.removeUserFromTicketItems(uid, ticketUser.id, itemIds, ticketId, sendNotification);
    }
  }

  /**
   * Add a user to all itmes on a ticket
   */
  async addUserToAllTicketItems(ticketId: number, uid: string, sendNotification: boolean) {
    const ticketUserRepo = await getRepository(TicketUser);
    const ticketUser = await ticketUserRepo.findOne({ ticket: { id: ticketId }, user: { uid } }, { relations: ['user', 'user.userDetail'] });

    if (ticketUser) {
      // get all ticket items that the user is **NOT** part of
      const ticketItemRepo = await getRepository(TicketItem);
      const items = await ticketItemRepo.createQueryBuilder('ticketItem')
        .leftJoin('ticketItem.users', 'ticketItemUser', 'ticketItemUser.user = :uid', { uid })
        .where('ticketItem.ticket = :ticketId AND ticketItemUser.user is NULL', { ticketId })
        .getMany();

      // get only the Ids of each item
      const itemIds: number[] = items.map(item => Number(item.id));

      await this.addUserToTicketItems(uid, ticketUser.id, itemIds, ticketId, sendNotification);
    }
  }
}