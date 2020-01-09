import { Injectable, Logger, BadRequestException, NotFoundException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { getRepository, getConnection, FindOneOptions, FindConditions, EntityManager, In } from 'typeorm';
import { TicketUser, Ticket, User, TicketItemUser, TicketItem, TicketTotal } from '@tabify/entities';
import { AblyService, OmnivoreService, TicketTotalService } from '@tabify/services';
import { TicketUpdates, TicketUserStatus, TicketUserStatusOrder } from '../enums';
import * as currency from 'currency.js';
import { OmnivoreTicketItem, OmnivoreTicketDiscount } from '@tabify/interfaces';

@Injectable()
export class TicketUserService {
  constructor(
    private readonly ablyService: AblyService,
    private readonly ticketTotalService: TicketTotalService,
    private readonly omnivoreService: OmnivoreService,
  ) { }

  async getTicketUserByTicketUserId(ticketUserId: number) {
    const ticketUserRepo = await getRepository(TicketUser);
    const ticketUser = await ticketUserRepo.findOneOrFail(ticketUserId);
    return ticketUser;
  }

  async getTicketUser(ticketId: number, uid: string) {
    const ticketUserRepo = getRepository(TicketUser);
    return await ticketUserRepo.createQueryBuilder('ticketUser')
    .leftJoinAndSelect('ticketUser.user', 'user')
    .leftJoinAndSelect('ticketUser.ticket', 'ticket')
    .leftJoinAndSelect('ticket.location', 'location')
    .leftJoinAndSelect('ticketUser.applicable_coupons', 'applicable_coupons')
    .where('user.uid = :uid', { uid })
    .andWhere('ticket.id = :ticketId', { ticketId })
    .getOne();
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
      items: Number(priceSum),
      sub_total: Number(priceSum),
      total: Number(priceSum),
      selectedItemsCount: Number(selectedItemsCount),
    };
    await ticketUserRepo.update(updatedTicketUser.id, {
      items: Number(priceSum),
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

  private calculateUserTax(users: TicketUser[], totals: TicketTotal, taxRate: number) {
    let distributedTaxTotal = 0;
    const distributedTax: currency[] = [];
    users.forEach( user => {
      const subtotalPercentage = user.sub_total / totals.sub_total;
      Logger.log(subtotalPercentage);
      const userTax = currency(subtotalPercentage * (totals.tax / 100));

      // not sure which approach is better between top and bottom - leaning towards top

      // const userTax = currency(taxRate * (user.sub_total / 100));
      distributedTax.push(userTax);
      distributedTaxTotal += userTax.intValue;
    });

    let index = 0;
    while (distributedTaxTotal !== totals.tax) {
      if (distributedTaxTotal < totals.tax) {
        distributedTax[index].add(1);
        distributedTaxTotal += 1;
      } else if (distributedTaxTotal > totals.tax) {
        distributedTax[index].subtract(1);
        distributedTaxTotal -= 1;
      }

      index++;

      if (index >= distributedTax.length) {
        index = 0;
      }
    }

    return distributedTax;
  }

  async updateTicketUserStatus(ticketId: number, ticketUserId: number, newUserStatus: TicketUserStatus, sendNotification: boolean) {
    const updatedTicketUser = await getConnection().transaction(async transactionalEntityManager => {
      const ticketUserRepo = await transactionalEntityManager.getRepository(TicketUser);
      const ticketUsers = await ticketUserRepo.find({ where: { ticket: ticketId } });
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
      const { payingTicketUsers: updatedTicketUsers, ticketTotal } = await getConnection().transaction(async transactionalEntityManager => {
        const ticketUserRepo = await transactionalEntityManager.getRepository(TicketUser);
        const ticketUsers = await ticketUserRepo.find({ where: { ticket: ticketId }, relations: ['user'] });

        // If all have confirmed, set everyone's status to PAYING
        if (ticketUsers.every(user => user.status === TicketUserStatus.CONFIRMED)) {
          // Everyone has confirmed!
          const ticketRepo = transactionalEntityManager.getRepository(Ticket);
          const ticket = await ticketRepo.findOneOrFail(ticketId, { relations: ['location', 'ticketTotal'] });

          // // Apply Tabify new user discount if this ticket contains one or more new users
          // let containsNewUser = false;
          // for (const ticketUser of ticketUsers) {
          //   const numberOfTicketsForUser = await ticketUserRepo.count({ where: { user: ticketUser.user!.uid } });

          //   // This should never happen since all users should be on at least 1 ticket at this point
          //   if (!numberOfTicketsForUser || numberOfTicketsForUser === 0) {
          //     throw new InternalServerErrorException(`An error occurred while counting the number of tickets that the users have been
          //     associated with.`);
          //   }

          //   // Check if this is the user's first ticket. If so, set containsNewUser to true and break.
          //   if (numberOfTicketsForUser === 1) {
          //     containsNewUser = true;
          //     break;
          //   }
          // }

          // // TODO: Finalize and environmentalize this value
          // let discountAmount = 500;
          // let distributedDiscount = currency(discountAmount / 100).distribute(ticketUsers.length);

          // // Verify that every user's subtotal remains > $0.25 by applying the discount
          // const compatibleDiscount = ticketUsers.every((ticketUser: TicketUser, index: number) =>
          //   (ticketUser.sub_total - distributedDiscount[index].intValue) > 25);

          // // Only apply to Piccola's
          // const isPiccolas = ticket.location!.omnivore_id === 'cx9pap8i';
          // const openDiscountId = ticket.location!.open_discount_id;

          // // Apply discount on this ticket if containsNewUser and compatibleDiscount and isPiccolas
          // if (containsNewUser && compatibleDiscount && isPiccolas && openDiscountId) {
          //   Logger.log('This discount is compatible. Apply it!');
          //   // TODO: Move discount id to database
          //   // const discounts: OmnivoreTicketDiscount[] = [{ discount: openDiscountId, value: discountAmount }];
          //   const discounts: OmnivoreTicketDiscount[] = [{ discount: '1847-53-17', value: discountAmount }];
          //   // const discountMenuItem: OmnivoreTicketItem = { menu_item: '1847-53-17', quantity: 1, price_per_unit: discountAmount };
          //   try {
          //     const response = await this.omnivoreService.applyDiscountsToTicket(ticket.location!, ticket.tab_id!, discounts);
          //     const { totals } = response;

          //     await this.ticketTotalService.updateTicketTotals({
          //       id: ticket.ticketTotal!.id,
          //       discounts: totals.discounts,
          //       due: totals.due,
          //       items: totals.items,
          //       other_charges: totals.other_charges,
          //       paid: totals.paid,
          //       service_charges: totals.service_charges,
          //       sub_total: totals.sub_total,
          //       tax: totals.tax,
          //       tips: totals.tips,
          //       total: totals.total,
          //     });
          //     Logger.log(response, 'The updated ticket with discount');
          //   } catch (e) {
          //     Logger.error(e, undefined, 'An error occurred while adding the discount ticket item');
          //     throw new InternalServerErrorException(e, 'An error occurred while adding the discount ticket item');
          //   }
          // }
          // // If not compatible, reset discount to 0
          // else {
          //   Logger.log('No new users found or the discount is NOT compatible; don\'t apply Tabify discount or no open value discount is provided');
          //   discountAmount = 0;
          //   distributedDiscount = currency(discountAmount / 100).distribute(ticketUsers.length);
          // }

          // Before setting everyone's status to PAYING,
          // first check if all items are claimed by at least one person
          const ticketItemRepo = transactionalEntityManager.getRepository(TicketItem);
          const ticketItems = await ticketItemRepo.find({ where: { ticket: ticketId }, relations: ['users', 'users.user'] });
          if (ticketItems.some(item => item.users!.length === 0)) {
            // TODO: Consider setting everyone's status back down to WAITING at this point
            throw new BadRequestException('All users have confirmed, but some items are still unclaimed.');
          }

          // Set everyone's status to PAYING and also verify and finalize the totals.
          const ticketTotal = await this.ticketTotalService.getTicketTotals(ticketId);
          if (!ticketTotal) throw new InternalServerErrorException('Cannot load the ticket totals.');

          // const distributedTax = currency(ticketTotal.tax / 100).distribute(ticketUsers.length);
          const distributedTax = this.calculateUserTax(ticketUsers, ticketTotal, ticket.location!.tax_rate!)
          let allUsersItems = 0;
          let allUsersDiscounts = 0;
          let allUsersSubtotal = 0;
          let allUsersTax = 0;
          let allUsersTotal = 0;
          ticketUsers.forEach((ticketUser: TicketUser, index: number) => {
            // Subtract discount from each ticket user if applicable
            // ticketUser.discounts = distributedDiscount[index].intValue;
            // ticketUser.sub_total = ticketUser.sub_total - ticketUser.discounts;

            // Find sum of the selected items for this user
            let items = 0;
            ticketItems.forEach((ticketItem) => {
              const userOnItem = ticketItem.users!.find(u => u.user.uid === ticketUser.user!.uid);
              if (userOnItem) {
                items += userOnItem.price;
              }

              let ticketItemUsersSum = 0;
              ticketItem.users!.forEach(u => ticketItemUsersSum += u.price);
              if (ticketItemUsersSum !== ticketItem.price) {
                throw new InternalServerErrorException('The sum of the ticket item users share does not match the item\'s price.');
              }
            });
            // Error checking
            if (items !== ticketUser.items) {
              console.error('items', items);
              console.error('ticketUser.items', ticketUser.items);
              throw new InternalServerErrorException('The sum of the user\'s selected items does not match the user\'s items total.');
            }
            // Error checking
            if ((items - ticketUser.discounts) !== ticketUser.sub_total) {
              // TODO: Consider resynchronizing each user's subtotal at this point
              console.error('items', items);
              console.error('ticketUser.sub_total', ticketUser.sub_total);

              throw new InternalServerErrorException('The sum of the user\'s selected items minus discounts does not match the user\'s subtotal.');
            }

            allUsersItems += ticketUser.items;
            allUsersDiscounts += ticketUser.discounts;
            allUsersSubtotal += ticketUser.sub_total;

            // Distribute the tax proportionally
            ticketUser.tax = distributedTax[index].intValue;
             // calculate user tax
            // ticketUser.tax = currency( (ticketUser.sub_total / 100) * ticket.location!.tax_rate!).intValue;
            allUsersTax += ticketUser.tax;

            // Set the user total
            ticketUser.total = ticketUser.sub_total + ticketUser.tax;
            allUsersTotal += ticketUser.total;

            // Set the user status to PAYING
            ticketUser.status = TicketUserStatus.PAYING;
          });

          // Account for Omnivore Virtual POS bug that adds a $5 service charge to every ticket
          if (ticket.location!.omnivore_id === 'i8yBgkjT') {
            allUsersTotal += 500;
          }

          // More error checking to make sure that the totals all match up
          if (
            allUsersItems !== ticketTotal.items ||
            allUsersDiscounts !== ticketTotal.discounts ||
            allUsersSubtotal !== ticketTotal.sub_total ||
            allUsersTax !== ticketTotal.tax ||
            allUsersTotal !== ticketTotal.total
          ) {
            console.error(allUsersItems, allUsersDiscounts, allUsersSubtotal, allUsersTax, allUsersTotal);
            console.error(ticketTotal.items, ticketTotal.discounts, ticketTotal.sub_total, ticketTotal.tax, ticketTotal.total);
            throw new InternalServerErrorException('The users\' subtotal, tax, or total is not equal to the ticket totals!');
          }

          // Save all ticket users
          const payingTicketUsers = await ticketUserRepo.save(ticketUsers);

          // Remove unnecessary nested User so that TicketUser override in the frontend is unaffected
          payingTicketUsers.forEach(u => u.user = undefined);
          return { payingTicketUsers, ticketTotal };
        }
        // Not everyone has confirmed yet, so just return the single updatedTicketUser
        else {
          return { payingTicketUsers: [updatedTicketUser] };
        }
      });

      if (sendNotification) {
        const messages: { name: string, data: any }[] = [
          { name: TicketUpdates.TICKET_USERS_UPDATED, data: updatedTicketUsers },
        ];
        if (ticketTotal) {
          messages.push({ name: TicketUpdates.TICKET_TOTALS_UPDATED, data: ticketTotal });
        }
        await this.ablyService.publish(
          TicketUpdates.MULTIPLE_UPDATES,
          messages,
          ticketId.toString());
      }

      // Return the TicketUser who initiated this request
      return updatedTicketUsers.find(_updatedTicketUser => _updatedTicketUser.id === ticketUserId);
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
