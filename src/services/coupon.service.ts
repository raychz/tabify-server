import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { getConnection, getRepository, getManager, EntityManager, In, MoreThanOrEqual } from 'typeorm';
import { UserToCoupons, Coupon, User, Location, Ticket, CouponOffOf, CouponType, TicketUser  } from '@tabify/entities';
import { OmnivoreService, TicketTotalService } from '@tabify/services';
import { OmnivoreTicketDiscount } from '@tabify/interfaces';

@Injectable()
export class CouponService {

    constructor(
      private readonly omnivoreService: OmnivoreService,
      private readonly ticketTotalService: TicketTotalService,
    ) { }

    // get user's coupons from db
    async getCoupons(uid: string) {
        const userCouponsRepo = await getRepository(UserToCoupons);
        const userCoupons = await userCouponsRepo.createQueryBuilder('userCoupon')
        .leftJoinAndSelect('userCoupon.coupon', 'coupon')
        .leftJoinAndSelect('coupon.location', 'location')
        .where('userCoupon.userUid = :uid', { uid })
        .getMany();

        const validCoupons: any[] = [];
        const usedCoupons: any[] = [];
        const upcomingCoupons: any[] = [];

        userCoupons.forEach( userCoupon => {
          if (userCoupon.usage_count > 0) {
            usedCoupons.push({ ...userCoupon.coupon, usage_count: userCoupon.usage_count });
          }
          if (userCoupon.coupon.coupon_start_date > new Date()) {
            upcomingCoupons.push({ ...userCoupon.coupon, usage_count: userCoupon.usage_count });
            // toDo: figure out date comparison as this isn't actually working
          // } else if (userCoupon.coupon.coupon_end_date >= new Date() && userCoupon.usage_count < userCoupon.coupon.usage_limit) {
          } else {
            validCoupons.push({ ...userCoupon.coupon, usage_count: userCoupon.usage_count });
          }
        });
        return {validCoupons, upcomingCoupons, usedCoupons};
    }

    async applyDiscount(couponId: number, ticket: Ticket, uid: string): Promise<Coupon> {

          const couponsRepo = await getRepository(Coupon);
          const coupon = await couponsRepo.findOneOrFail(couponId);

          let ticketUser: TicketUser | undefined;
          if (ticket.users) {
            ticketUser = ticket.users!.find( user => user.user!.uid === uid );
          }

          let couponValue = -1;
          let itemPrice = ticketUser!.sub_total;
          if (coupon.coupon_off_of === CouponOffOf.ITEM) {
            const couponTicketItem = ticket.items!.find( ticketItem => {
              return ticketItem.ticket_item_id === coupon.menu_item_id;
            });
            if (couponTicketItem) {
              const itemUser = couponTicketItem.users!.find(user => user.user.uid === uid);
              if (itemUser) {
                itemPrice = itemUser.price;
              } else {
                throw new BadRequestException('Coupon applies to an item that the user is not paying for and can not be applied.');
              }
            } else {
              throw new BadRequestException('Coupon applies to an item not on the ticket and can not be applied.');
            }
          }
          couponValue = coupon.value;
          if (coupon.coupon_type === CouponType.PERCENT) {
            couponValue = currency(itemPrice / 100).multiply(coupon.value / 100).intValue;
          }

          // Verify that the user's subtotal remains > $0.25 by applying the discount
          let compatibleDiscount = false;
          if (ticketUser) {
            compatibleDiscount = (ticketUser.sub_total - couponValue) > 25;
          }

          // Verify that the discount location has an openDiscount
          const openDiscountId = ticket.location!.open_discount_id;

          // Apply discount on this ticket if it is compatbile - location has open discount and user's price > $0.25
          if (compatibleDiscount && openDiscountId) {
            Logger.log('This discount is compatible. Apply it!');
            const discounts: OmnivoreTicketDiscount[] = [{ discount: openDiscountId, value: couponValue }];
            // Piccolas open discount id = '1847-53-17'
            // const discounts: OmnivoreTicketDiscount[] = [{ discount: '1847-53-17', value: discountAmount }];
            // const discountMenuItem: OmnivoreTicketItem = { menu_item: '1847-53-17', quantity: 1, price_per_unit: discountAmount };
            try {
              const response = await this.omnivoreService.applyDiscountsToTicket(ticket.location!, ticket.tab_id!, discounts);
              const { totals } = response;

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
              const userCoupon = await userCouponsRepo.findOne({where: {user: ticketUser!.user!.uid, coupon: couponId}});
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
          return coupon;
    }

    async assignUsersValidCoupons(userUids: string[]) {
      await getManager().transaction(async (transactionalEntityManager: EntityManager) => {
        try {
            const coupons = await transactionalEntityManager.find(Coupon,
              {where: {applies_to_everyone: true, coupon_end_date: MoreThanOrEqual(new Date())} });
            const users = await transactionalEntityManager.find(User, {where: { uid: In(userUids) }});

            coupons.forEach(coupon => {
              users.forEach(user => {
                transactionalEntityManager.insert(UserToCoupons, {usage_count: 0, user, coupon});
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