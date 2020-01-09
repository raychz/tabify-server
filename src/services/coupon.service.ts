import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { getRepository, getManager, EntityManager, In, MoreThanOrEqual, LessThanOrEqual, MoreThan } from 'typeorm';
import { UserToCoupons, Coupon, User, Location, Ticket, CouponOffOf,
  CouponType, TicketUser, TicketItem, TicketTotal  } from '@tabify/entities';
import { OmnivoreService, TicketTotalService } from '@tabify/services';
import { OmnivoreTicketDiscount } from '@tabify/interfaces';
import * as currency from 'currency.js';

@Injectable()
export class CouponService {

    constructor(
      private readonly omnivoreService: OmnivoreService,
      private readonly ticketTotalService: TicketTotalService,
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
        .andWhere('coupon.coupon_end_date')
        .orderBy('coupon.estimated_dollar_value', 'DESC');

        if (locationId) {
          query.andWhere('location.id = :locationId', { locationId });
        }

        const userCoupons = await query.getMany();

        return this.groupCoupons(userCoupons);
    }

    groupCoupons(userCoupons: UserToCoupons[]) {
      const validCoupons: any[] = [];
      const usedCoupons: any[] = [];
      const upcomingCoupons: any[] = [];

      userCoupons.forEach( userCoupon => {
        if (userCoupon.usage_count > 0) {
          usedCoupons.push({ ...userCoupon.coupon, usage_count: userCoupon.usage_count });
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (new Date(userCoupon.coupon.coupon_start_date).getTime() > new Date().getTime()) {
          upcomingCoupons.push({ ...userCoupon.coupon, usage_count: userCoupon.usage_count });
        } else if (new Date(userCoupon.coupon.coupon_end_date).getTime() > yesterday.getTime()
        && userCoupon.usage_count < userCoupon.coupon.usage_limit) {
          validCoupons.push({ ...userCoupon.coupon, usage_count: userCoupon.usage_count });
        }
      });
      return {validCoupons, upcomingCoupons, usedCoupons};
    }

    async applyDiscount(couponId: number, ticket: Ticket, uid: string): Promise<{coupon: Coupon, res: any}> {

          const couponsRepo = await getRepository(Coupon);
          const coupon = await couponsRepo.findOneOrFail({where: {id: couponId}, relations: ['location']});
          Logger.log(coupon);

          const res = this.calculateCouponWorth(coupon, ticket, uid);

          // Apply discount on this ticket if it is compatbile - location has open discount and user's price > $0.25
          if (res.valid) {
            const openDiscountId = ticket.location!.open_discount_id!;
            Logger.log('This discount is compatible. Apply it!');
            const discounts: OmnivoreTicketDiscount[] = [{ discount: openDiscountId, value: res.dollar_value }];
            // Piccolas open discount id = '1847-53-17'
            // const discounts: OmnivoreTicketDiscount[] = [{ discount: '1847-53-17', value: discountAmount }];
            // const discountMenuItem: OmnivoreTicketItem = { menu_item: '1847-53-17', quantity: 1, price_per_unit: discountAmount };
            try {
              const currentTotalTax = ticket.ticketTotal!.tax;

              const response = await this.omnivoreService.applyDiscountsToTicket(ticket.location!, ticket.tab_id!, discounts);
              const { totals } = response;

              const newTax: number = totals.tax;
              const actualTaxDifference = currency((currentTotalTax / 100) - (newTax / 100)).intValue;

              if (res.taxDifference !== actualTaxDifference) {
                Logger.log(`tax estimate was off by ${currency((res.taxDifference / 100) - (actualTaxDifference / 100))}`);
                res.taxDifference = actualTaxDifference;
              }

              const ticketUser = ticket.users!.find( user => user.user!.uid === uid)!;

              ticketUser.tax -= actualTaxDifference;
              ticketUser.selected_coupon = coupon;
              const ticketUserRepo = await getRepository(TicketUser);
              await ticketUserRepo.save(ticketUser);

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
              });
              Logger.log(response, 'The updated ticket with discount');

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

    private calculateCouponWorth(coupon: Coupon, ticket: Ticket, userUid: string):
    {valid: boolean, message: string | undefined, dollar_value: number, taxDifference: number} {
      let dollar_value = 0;
      let taxDifference = 0;
      let valid = true;
      let message;
      if (!ticket.location!.open_discount_id) {
        valid = false;
        message = 'Location does not have an open discount id - coupon is invalid';
        return {valid, message, dollar_value, taxDifference};
      }

      const ticketUser = ticket.users!.find( user => user.user!.uid === userUid);
      if (!ticketUser) {
        valid = false;
        message = 'User is not on ticket';
        return {valid, message, dollar_value, taxDifference};
      }
      let itemPrice = ticketUser.sub_total;
      let ticketItemName;
      if (coupon.coupon_off_of === CouponOffOf.ITEM) {
        const couponTicketItem = ticket.items!.find( ticketItem => {
          Logger.log(ticketItem.ticket_item_id);
          return ticketItem.ticket_item_id === coupon.menu_item_id;
        });
        if (!couponTicketItem) {
          valid = false;
          message = 'Coupon applies to an item not on the ticket and can not be applied.';
          return {valid, message, dollar_value, taxDifference};
        }
        ticketItemName = couponTicketItem.name;
        const itemUser = couponTicketItem.users!.find(user => user.user.uid === ticketUser.user!.uid);
        if (!itemUser) {
          valid = false;
          message = 'Coupon applies to an item that the user is not paying for and can not be applied.';
          return {valid, message, dollar_value, taxDifference};
        }
        itemPrice = itemUser.price ;
      }
      dollar_value = coupon.value;
      if (coupon.coupon_type === CouponType.PERCENT) {
        dollar_value = itemPrice * (coupon.value / 100);
      }

      if ((ticketUser.sub_total - dollar_value) <= 25) {
          valid = false;
          message = 'Coupon makes user\'s subtotal fall below the $0.25 minimum and is not valid';
          return {valid, message, dollar_value, taxDifference};
      }
      // coupon.estimated_dollar_value = couponValue;
      const currentTax = ticket.ticketTotal!.tax;
      const taxRate = coupon.location!.tax_rate!;
      const newTax = (ticket.ticketTotal!.sub_total - dollar_value) * (taxRate / 100);
      taxDifference = currency((currentTax - newTax) / 100).intValue;

      return {valid, message: ticketItemName, dollar_value, taxDifference};
    }

    async getApplicableTicketUserCoupons(validCoupons: any[], ticket: Ticket, userUid: string) {
      Logger.log(validCoupons);
      validCoupons.filter(async coupon => {
        const response = this.calculateCouponWorth(coupon, ticket, userUid);

        coupon.dollar_value = response.dollar_value;
        coupon.menu_item_name = response.message;
        coupon.estimated_tax_difference = response.taxDifference;

        return response.valid;

      });

      validCoupons.sort((couponA, couponB) => couponB.dollar_value - couponA.dollar_value);
      Logger.log(validCoupons);

      return validCoupons;
    }

    async assignUsersValidCoupons(userUids: string[]) {
      await getManager().transaction(async (transactionalEntityManager: EntityManager) => {
        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const coupons = await transactionalEntityManager.find(Coupon,
              {where: {applies_to_everyone: true, coupon_end_date: MoreThan(yesterday)} });
            const users = await transactionalEntityManager.find(User, {where: { uid: In(userUids) }});

            coupons.forEach(coupon => {
              users.forEach(user => {
                transactionalEntityManager.save(UserToCoupons, {usage_count: 0, user, coupon});
              });
            });
          } catch (error) {
            throw new InternalServerErrorException(error);
          }
        });
    }

    async saveNewCoupon(coupon: Coupon, locationOmnivoreId: string, userUids?: string[]): Promise<Coupon> {

        return await getManager().transaction(async (transactionalEntityManager: EntityManager) => {
          try {
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
            } catch (error) {
              Logger.log(error);
              throw new InternalServerErrorException();
            }
          });
    }
}