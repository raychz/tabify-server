import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { getRepository, getConnection, EntityManager, In } from 'typeorm';
import { TicketItemUser, TicketItem, User, TicketUser } from '@tabify/entities';
import * as currency from 'currency.js';
import { TicketUserService } from './ticket-user.service';

@Injectable()
export class TicketItemService {
  constructor(private ticketUserService: TicketUserService) { }

  async addUserToTicketItem(uid: string, itemId: number) {
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
      ticketItemUsers.push({ ticketItem, user: { uid } as User, price: 0 });

      // Evenly distribute the cost of the item amongst the ticket item users
      this.distributeItemPrice(ticketItem.price!, ticketItemUsers);

      // Save updated ticket item users
      const ticketItemUserRepo = await transactionalEntityManager.getRepository(TicketItemUser);
      const updatedTicketItemUsers = await ticketItemUserRepo.save(ticketItemUsers);

      // Update subtotals for each user on this item; get their items and get their TicketUser entity and update the price to be the sum of the items
      for (const updatedTicketItemUser of updatedTicketItemUsers) {
        await this.ticketUserService.updateTicketUserTotals(
          ticketItem.ticket!,
          updatedTicketItemUser.user,
          transactionalEntityManager,
        );
      }
      return updatedTicketItemUsers;
    });
  }

  async removeUserFromTicketItem(uid: string, itemId: number) {
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
      const removedTicketItemUser = ticketItemUsers.splice(userIndex)[0];

      // Evenly distribute the cost of the item amongst the ticket item users
      this.distributeItemPrice(ticketItem.price!, ticketItemUsers);

      // Remove ticket item user
      const ticketItemUserRepo = await transactionalEntityManager.getRepository(TicketItemUser);
      const removedTicketItemUsers = await ticketItemUserRepo.remove(removedTicketItemUser);

      // Save updated ticket item users
      const updatedTicketItemUsers = await ticketItemUserRepo.save(ticketItemUsers);

      // Update subtotals for each user on this item; get their items and get their TicketUser entity and update the price to be the sum of the items
      for (const updatedTicketItemUser of updatedTicketItemUsers) {
        await this.ticketUserService.updateTicketUserTotals(
          ticketItem.ticket!,
          updatedTicketItemUser.user,
          transactionalEntityManager,
        );
      }
      return updatedTicketItemUsers;
    });
  }

  async getTicketItem(itemId: number, manager?: EntityManager) {
    const ticketItemRepo = manager ? await manager.getRepository(TicketItem) : getRepository(TicketItem);

    return await ticketItemRepo.findOneOrFail({
      where: { id: itemId },
      relations: ['ticket'],
      lock: manager ? { mode: 'pessimistic_read' } : undefined,
    });
  }

  /** Distributes the cost of an item evenly amongst ticket item users */
  private distributeItemPrice(price: number, ticketItemUsers: TicketItemUser[]) {
    currency(price / 100)
      .distribute(ticketItemUsers.length)
      .forEach((d, index) => ticketItemUsers[index].price = d.intValue);
  }
}
