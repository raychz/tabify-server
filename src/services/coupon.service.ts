import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { getRepository, getManager, EntityManager, In, MoreThanOrEqual } from 'typeorm';
import { UserToCoupons, Coupon, User, Location, Ticket, CouponOffOf,
  CouponType, TicketUser, TicketItem, ApplicableCoupon, TicketTotal  } from '@tabify/entities';
import { OmnivoreService, TicketTotalService } from '@tabify/services';
import { OmnivoreTicketDiscount } from '@tabify/interfaces';

@Injectable()
export class CouponService {

    constructor(
      private readonly omnivoreService: OmnivoreService,
      private readonly ticketTotalService: TicketTotalService,
    ) { }

    // get user's coupons from db
    async getUserCoupons(uid: string, locationId?: number) {
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
        return userCoupons;
    }

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
        && userCoupon.usage_count < userCoupon.coupon.usage_limit) {
          validCoupons.push({ ...userCoupon.coupon, usage_count: userCoupon.usage_count });
        }
      });
      return {validCoupons, upcomingCoupons, usedCoupons};
    }

    async applyDiscount(applicableCouponId: number, ticket: Ticket, uid: string): Promise<ApplicableCoupon> {

          const applicableCouponsRepo = await getRepository(ApplicableCoupon);
          let applicableCoupon = await applicableCouponsRepo.findOneOrFail(applicableCouponId);

          const ticketUser = ticket.users!.find( user => user.user!.uid === uid );

          if (applicableCoupon.coupon.coupon_off_of === CouponOffOf.ITEM) {
            const couponTicketItem = ticket.items!.find( ticketItem => {
              return ticketItem.ticket_item_id === applicableCoupon.coupon.menu_item_id;
            });
            if (couponTicketItem) {
              const itemUser = couponTicketItem.users!.find(user => user.user.uid === uid);
              if (!itemUser) {
                throw new BadRequestException('Coupon applies to an item that the user is not paying for and can not be applied.');
              }
            } else {
              throw new BadRequestException('Coupon applies to an item not on the ticket and can not be applied.');
            }
          }

          // Verify that the user's subtotal remains > $0.25 by applying the discount
          let compatibleDiscount = false;
          if (ticketUser) {
            compatibleDiscount = (ticketUser.sub_total - applicableCoupon.dollar_value) > 25;
          } else {
            throw new BadRequestException('User is not on ticket');
          }

          // Verify that the discount location has an openDiscount
          const openDiscountId = ticket.location!.open_discount_id;

          // Apply discount on this ticket if it is compatbile - location has open discount and user's price > $0.25
          if (compatibleDiscount && openDiscountId) {
            Logger.log('This discount is compatible. Apply it!');
            const discounts: OmnivoreTicketDiscount[] = [{ discount: openDiscountId, value: applicableCoupon.dollar_value }];
            // Piccolas open discount id = '1847-53-17'
            // const discounts: OmnivoreTicketDiscount[] = [{ discount: '1847-53-17', value: discountAmount }];
            // const discountMenuItem: OmnivoreTicketItem = { menu_item: '1847-53-17', quantity: 1, price_per_unit: discountAmount };
            try {
              const currentTotalTax = ticket.ticketTotal!.tax;

              const response = await this.omnivoreService.applyDiscountsToTicket(ticket.location!, ticket.tab_id!, discounts);
              const { totals } = response;

              const newTax: number = totals.tax;
              const actualTaxDifference = currency((currentTotalTax / 100) - (newTax / 100)).intValue;

              if (applicableCoupon.estimated_tax_difference !== actualTaxDifference) {
                Logger.log(`tax estimate was off by ${currency((applicableCoupon.estimated_tax_difference / 100) - (actualTaxDifference / 100))}`);
              }

              applicableCoupon.estimated_tax_difference = actualTaxDifference;
              applicableCoupon = await applicableCouponsRepo.save(applicableCoupon);

              ticketUser.tax -= actualTaxDifference;
              ticketUser.selected_coupon = applicableCoupon;
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
              const userCoupon = await userCouponsRepo.findOne({where: {user: ticketUser!.user!.uid, coupon: applicableCoupon.coupon.id}});
              userCoupon!.usage_count += 1;
              userCouponsRepo.save(userCoupon!);

            } catch (e) {
              Logger.error(e, undefined, 'An error occurred while adding the discount ticket item');
              throw new InternalServerErrorException(e, 'An error occurred while adding the discount ticket item');
            }
          }
          // If not compatible, reset discount to 0
          else {
            Logger.log(`The discount is NOT compatible: either the users total would fall below the 25¢ minimum
            or the location does not have an open disocunt provided`);
            throw new InternalServerErrorException('Coupon is not compatible, please try again or select another one.');
          }
          return applicableCoupon;
    }

    async assignTicketUserApplicableCoupons(ticketUser: TicketUser, userCoupons: UserToCoupons[],
                                            ticketItems: TicketItem[], ticketTotal: TicketTotal) {
      const validCoupons: any[] = [];

      await getManager().transaction(async (transactionalEntityManager: EntityManager) => {
        try {
            userCoupons.forEach(async userCoupon => {
              let couponValue = currency(0);
              const coupon = userCoupon.coupon;
              let itemPrice = currency(ticketUser.sub_total / 100);
              let ticketItemName;
              if (coupon.coupon_off_of === CouponOffOf.ITEM) {
                const couponTicketItem = ticketItems.find( ticketItem => {
                  return ticketItem.ticket_item_id === coupon.menu_item_id;
                });
                if (!couponTicketItem) {
                  return;
                }
                ticketItemName = couponTicketItem.name;
                const itemUser = couponTicketItem.users!.find(user => user.user.uid === ticketUser.user!.uid);
                if (!itemUser) {
                  return;
                }
                itemPrice = currency(itemUser.price / 100);
              }
              couponValue = currency(coupon.value / 100);
              if (coupon.coupon_type === CouponType.PERCENT) {
                couponValue = itemPrice.multiply(coupon.value / 100);
              }

              if ((ticketUser.sub_total - couponValue.intValue) <= 25) {
                return;
              }
              // coupon.estimated_dollar_value = couponValue;
              const currentTax = currency(ticketTotal.tax);
              const newTax = currency((ticketTotal.sub_total - couponValue.intValue) * ticketUser.ticket!.location!.tax_rate!);
              const taxDiffernce = currentTax.subtract(newTax);

              const applicableCoupon: ApplicableCoupon = {
                dollar_value: couponValue.intValue,
                coupon,
                ticketUser,
                estimated_tax_difference: taxDiffernce.intValue,
              };
              const insertedApplicableCoupon = await transactionalEntityManager.save(ApplicableCoupon, applicableCoupon);

              validCoupons.push({ ...userCoupon.coupon, usage_count: userCoupon.usage_count,
              menu_item_name: ticketItemName, applicableCoupon: insertedApplicableCoupon });

      });

            transactionalEntityManager.queryRunner!.commitTransaction();
          } catch (error) {
            transactionalEntityManager.queryRunner!.rollbackTransaction();
            throw new InternalServerErrorException(error);
          }
        });
      validCoupons.sort((couponA, couponB) => couponB.dollar_value - couponA.dollar_value);

      return {validCoupons, upcomingCoupons: [], usedCoupons: []};
    }

    async assignUsersValidCoupons(userUids: string[]) {
      await getManager().transaction(async (transactionalEntityManager: EntityManager) => {
        try {
            const coupons = await transactionalEntityManager.find(Coupon,
              {where: {applies_to_everyone: true, coupon_end_date: MoreThanOrEqual(new Date())} });
            const users = await transactionalEntityManager.find(User, {where: { uid: In(userUids) }});

            coupons.forEach(coupon => {
              users.forEach(user => {
                transactionalEntityManager.save(UserToCoupons, {usage_count: 0, user, coupon});
              });
            });

            transactionalEntityManager.queryRunner!.commitTransaction();
          } catch (error) {
            transactionalEntityManager.queryRunner!.rollbackTransaction();
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
                transactionalEntityManager.insert(UserToCoupons, {usage_count: 0, user, coupon: dbCoupon});
              });
              transactionalEntityManager.queryRunner!.commitTransaction();
              return dbCoupon;
            } catch (error) {
              transactionalEntityManager.queryRunner!.rollbackTransaction();
              throw new InternalServerErrorException();
            }
          });
    }
}