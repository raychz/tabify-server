import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { getRepository, getManager, EntityManager, In, MoreThanOrEqual, LessThanOrEqual, MoreThan } from 'typeorm';
import { UserToCoupons, Coupon, User, Location, Ticket, CouponOffOf,
  CouponType, TicketUser, TicketItem, TicketTotal  } from '@tabify/entities';
import { OmnivoreService, TicketTotalService, AblyService } from '@tabify/services';
import { OmnivoreTicketDiscount } from '@tabify/interfaces';
import * as currency from 'currency.js';
import { TicketUpdates } from 'enums';

@Injectable()
export class CouponService {

    constructor(
      private readonly omnivoreService: OmnivoreService,
      private readonly ticketTotalService: TicketTotalService,
      private readonly ablyService: AblyService,
    ) { }

    // get user's coupons from db
    async getCoupons(uid: string, locationId?: number) {
        const userCouponsRepo = await getRepository(UserToCoupons);
        const query = userCouponsRepo.createQueryBuilder('userCoupon')
        .leftJoinAndSelect('userCoupon.coupon', 'coupon')
        .leftJoinAndSelect('userCoupon.user', 'user')
        .leftJoinAndSelect('coupon.location', 'location')
        .where('user.uid = :uid', { uid })
        .andWhere('location.open_discount_id IS NOT NULL')
        .orderBy('coupon.estimated_dollar_value', 'DESC');

        if (locationId) {
          query.andWhere('location.id = :locationId', { locationId });
        }

        const userCoupons = await query.getMany();
        return this.groupCoupons(userCoupons);
    }

    // group coupons into the 3 classifications: valid, upcoming, and used
    groupCoupons(userCoupons: UserToCoupons[]) {
      const validCoupons: any[] = [];
      const usedCoupons: any[] = [];
      const upcomingCoupons: any[] = [];

      userCoupons.forEach( userCoupon => {
        if (userCoupon.usage_count > 0) {
          usedCoupons.push({ ...userCoupon.coupon, usage_count: userCoupon.usage_count });
        }

        if (new Date(userCoupon.coupon.coupon_start_date).getTime() > new Date().getTime()) {
          upcomingCoupons.push({ ...userCoupon.coupon, usage_count: userCoupon.usage_count });
        } else if (new Date(userCoupon.coupon.coupon_end_date).getTime() >= new Date().getTime()
        && (!userCoupon.coupon.usage_limit || userCoupon.usage_count < userCoupon.coupon.usage_limit)) {
          validCoupons.push({ ...userCoupon.coupon, usage_count: userCoupon.usage_count });
        }
      });
      return {validCoupons, upcomingCoupons, usedCoupons};
    }

    // apply the discount to the ticket
    async applyDiscount(couponId: number, ticket: Ticket, uid: string): Promise<{coupon: Coupon | undefined, res: any}> {

        // find the coupon from the db
          const couponsRepo = await getRepository(Coupon);
          const coupon = await couponsRepo.findOneOrFail({where: {id: couponId}, relations: ['location']});

          // calculate value of the coupon and its validity
          const res = this.calculateCouponWorth(coupon, ticket, uid);
          const ticketUser = ticket.users!.find( user => user.user!.uid === uid)!;
          // if the user has already applied a coupon, don't let them apply a second one.
          // silently return rather than throwing an error as to not disrupt the rest of the payment flow
          if (ticketUser.selected_coupon) {
            const message = 'User has already applied a coupon, cannot apply a second one.';
            Logger.log(message);
            return {coupon: undefined, res: {valid: false, message, dollar_value: 0, taxDifference: 0}};
          }
          // Apply discount on this ticket if it is compatbile
          if (res.valid) {
            const openDiscountId = ticket.location!.open_discount_id!;
            const discounts: OmnivoreTicketDiscount[] = [{ discount: openDiscountId, value: res.dollar_value }];
            try {
              // get the current totals object before discount
              const currentTotalTax = ticket.ticketTotal!.tax;

              // apply the discount through omnivore
              const response = await this.omnivoreService.applyDiscountsToTicket(ticket.location!, ticket.tab_id!, discounts);

              // get the totals object after discount
              const { totals } = response;

              const newTax: number = totals.tax;
              // calculate how much the tax changed by
              const actualTaxDifference = currency((currentTotalTax / 100) - (newTax / 100)).intValue;

              // compare actual tax difference to estimate
              if (res.taxDifference !== actualTaxDifference) {
                Logger.log(`tax estimate was off by ${currency((res.taxDifference / 100) - (actualTaxDifference / 100))}`);
                res.taxDifference = actualTaxDifference;
              }

              if (!ticket.users) {
                throw new InternalServerErrorException('ticket users is not defined');
              }

              // update the ticket user's tax, total, and discount fields
              ticketUser.tax -= actualTaxDifference;
              ticketUser.discounts += res.dollar_value;
              ticketUser.total -= (actualTaxDifference + res.dollar_value);
              ticketUser.selected_coupon = coupon;
              const ticketUserRepo = await getRepository(TicketUser);
              const updatedTicketUser = await ticketUserRepo.save(ticketUser);

              // send an ably message to signify that the coupon has been applied - disable coupon editing later if payment fails
              await this.ablyService.publish(TicketUpdates.TICKET_USERS_UPDATED, [updatedTicketUser], String(ticket.id));

              // update the ticket totals object with the new totals response
              await this.ticketTotalService.updateTicketTotals({
                id: ticket.ticketTotal!.id,
                discounts: totals.discounts,
                due: totals.due,
                items: totals.items,
                other_charges: totals.other_charges,
                paid: totals.paid,
                service_charges: totals.service_charges,
                sub_total: totals.sub_total,
                tax: totals.tax,
                tips: totals.tips,
                total: totals.total,
              }, ticket.id!);

              // increment the coupon usage in the database
              const userCouponsRepo = await getRepository(UserToCoupons);
              const userCoupon = await userCouponsRepo.findOne({where: {user: ticketUser!.user!.uid, coupon: coupon.id}});
              userCoupon!.usage_count += 1;
              userCouponsRepo.save(userCoupon!);

            } catch (e) {
              Logger.error(e, undefined, 'An error occurred while applying the coupon');
              throw new InternalServerErrorException(e, 'An error occurred while applying the coupon');
            }
          } else {
            throw new BadRequestException(res.message);
          }
          return {coupon, res};
    }

    private checkCouponRestrictions(coupon: Coupon) {
      let timeIsValid = true;
      const couponRestrictions = coupon.coupon_restrictions;
      if (couponRestrictions) {
        const now = new Date();
        if (couponRestrictions.validTimes) {
          const validTimes: any[] = couponRestrictions.validTimes[now.getDay()];
          if (validTimes) {
            timeIsValid = false;
            for (const validTime of validTimes) {
              const validStartTime = new Date();
              const startTime = validTime.startTime.split(':');
              validStartTime.setHours(startTime[0], startTime[1], startTime[2]);
              const validEndTime = new Date();
              const endTime = validTime.endTime.split(':');
              validEndTime.setHours(endTime[0], endTime[1], endTime[2]);
              if (now.getTime() >= validStartTime.getTime() && now.getTime() <= validEndTime.getTime()) {
                timeIsValid = true;
                break;
              }
            }
          }
        }
        if (couponRestrictions.invalidTimes && timeIsValid) {
          const invalidTimes: any[] = couponRestrictions.invalidTimes[now.getDay()];
          if (invalidTimes) {
            for (const invalidTime of invalidTimes) {
              const invalidStartTime = new Date();
              const startTime = invalidTime.startTime.split(':');
              invalidStartTime.setHours(startTime[0], startTime[1], startTime[2]);
              const invalidEndTime = new Date();
              const endTime = invalidTime.endTime.split(':');
              invalidEndTime.setHours(endTime[0], endTime[1], endTime[2]);
              if (now.getTime() >= invalidStartTime.getTime() && now.getTime() <= invalidEndTime.getTime()) {
                timeIsValid = false;
                break;
              }
            }
          }
        }
      }
      return timeIsValid;
    }

    private calculateCouponWorth(coupon: Coupon, ticket: Ticket, userUid: string):
    {valid: boolean, message: string | undefined, dollar_value: number, taxDifference: number} {
      let dollar_value = 0;
      let taxDifference = 0;
      let valid = true;
      let message;

      // check if the coupon is valid at the current time
      if (!this.checkCouponRestrictions(coupon) ||
      new Date(coupon.coupon_start_date).getTime() > new Date().getTime() ||
      new Date(coupon.coupon_end_date).getTime() < new Date().getTime()) {
        valid = false;
        message = 'Coupon is not valid at the current time';
        return {valid, message, dollar_value, taxDifference};
      }

      // invalid coupon if open discount id is not provided by the location entity
      if (!ticket.location!.open_discount_id) {
        valid = false;
        message = 'Location does not have an open discount id - coupon is invalid';
        return {valid, message, dollar_value, taxDifference};
      }

      // throw an error if ticket.users is not defined
      if (!ticket.users) {
        throw new InternalServerErrorException('ticket users is not defined');
      }

      const ticketUser = ticket.users!.find( user => user.user!.uid === userUid);

      // invalid if user is not on the ticket
      if (!ticketUser) {
        valid = false;
        message = 'User is not on ticket';
        return {valid, message, dollar_value, taxDifference};
      }

      // coupon is off of subtotal
      let itemPrice = ticketUser.sub_total;
      let ticketItemName;

    // coupon is off a specific item
      if (coupon.coupon_off_of === CouponOffOf.ITEM) {
        const couponTicketItem = ticket.items!.find( ticketItem => {
          return ticketItem.menu_item_id === coupon.menu_item_id;
        });

        // invalid if the item is not on the ticket
        if (!couponTicketItem) {
          valid = false;
          message = 'Coupon applies to an item not on the ticket and can not be applied.';
          return {valid, message, dollar_value, taxDifference};
        }
        ticketItemName = couponTicketItem.name;
        const itemUser = couponTicketItem.users!.find(user => user.user.uid === ticketUser.user!.uid);

        // invalid if the user is not on the ticket item
        if (!itemUser) {
          valid = false;
          message = 'Coupon applies to an item that the user is not paying for and can not be applied.';
          return {valid, message, dollar_value, taxDifference};
        }
        itemPrice = itemUser.price ;
      }

      // coupon value is a dollar value
      dollar_value = coupon.value;

      // coupon value is a percentage
      if (coupon.coupon_type === CouponType.PERCENT) {
        dollar_value = itemPrice * (coupon.value / 100);
      }

      // invalid if the user's subtotal is less than or equal to 25 cents
      if ((ticketUser.sub_total - dollar_value) <= 25) {
          valid = false;
          message = 'Coupon makes user\'s subtotal fall below the $0.25 minimum and is not valid';
          return {valid, message, dollar_value, taxDifference};
      }

      // calculate estimated tax difference of the coupon
      const currentTax = ticket.ticketTotal!.tax;
      const newTax = (ticket.ticketTotal!.sub_total - dollar_value) * (ticket.ticketTotal!.tax / ticket.ticketTotal!.sub_total);
      taxDifference = currency((currentTax - newTax) / 100).intValue;

      // return coupon validity and worth response
      return {valid, message: ticketItemName, dollar_value, taxDifference};
    }

    // get all valid coupons for a specific ticket and a specific ticket user
    async getApplicableTicketUserCoupons(coupons: any[], ticket: Ticket, userUid: string) {
      const validCoupons: any[] = [];
      coupons.forEach(async coupon => {
        const response = this.calculateCouponWorth(coupon, ticket, userUid);

        coupon.dollar_value = response.dollar_value;
        coupon.menu_item_name = response.message;
        coupon.estimated_tax_difference = response.taxDifference;
        if (response.valid) {
          validCoupons.push(coupon);
        }
      });

      validCoupons.sort((couponA, couponB) => couponB.dollar_value - couponA.dollar_value);

      return validCoupons;
    }

    // assign new users valid coupons
    async assignUsersValidCoupons(userUids: string[]) {
      await getManager().transaction(async (transactionalEntityManager: EntityManager) => {
          const coupons = await transactionalEntityManager.find(Coupon,
            {where: {applies_to_everyone: true, coupon_end_date: MoreThanOrEqual(new Date())} });
          const users = await transactionalEntityManager.find(User, {where: { uid: In(userUids) }});

          coupons.forEach(coupon => {
            users.forEach(user => {
              transactionalEntityManager.save(UserToCoupons, {usage_count: 0, user, coupon});
            });
          });
        });
    }

    // save new coupon in the database
    async saveNewCoupon(coupon: Coupon, locationOmnivoreId: string, userUids?: string[]): Promise<Coupon> {

        return await getManager().transaction(async (transactionalEntityManager: EntityManager) => {
            const location = await transactionalEntityManager.findOneOrFail(Location, {where: {omnivore_id: locationOmnivoreId}});
            coupon.location = location;
            const dbCoupon = await transactionalEntityManager.save(Coupon, coupon);
            let users: User[];
            if (userUids) {
              users = await transactionalEntityManager.find(User, {where: { uid: In(userUids) }});
            } else {
              users = await transactionalEntityManager.find(User);
            }
            users.forEach(user => {
              transactionalEntityManager.save(UserToCoupons, {usage_count: 0, user, coupon: dbCoupon});
            });
            return dbCoupon;
          });
    }
}