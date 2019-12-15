import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { getConnection, getRepository, getManager, EntityManager } from 'typeorm';
import { UserToCoupons, Coupon, User, Location  } from '@tabify/entities';

@Injectable()
export class CouponService {

    constructor() { }

    // get all comments from the server
    async getCoupons(uid: string) {
        const userCouponsRepo = await getRepository(UserToCoupons);
        const userCoupons = await userCouponsRepo.createQueryBuilder('userCoupon')
        .leftJoinAndSelect('userCoupon.coupon', 'coupon')
        .leftJoinAndSelect('coupon.location', 'location')
        .where('userCoupon.userUid = :uid', { uid })
        .getMany();

        const validCoupons: any[] = [];
        const expiredCoupons: any[] = [];
        const upcomingCoupons: any[] = [];
        userCoupons.forEach( userCoupon => {
          if (userCoupon.usage_count >= userCoupon.coupon.usage_limit || userCoupon.coupon.coupon_end_date >= new Date()) {
            expiredCoupons.push({ ...userCoupon.coupon, usage_count: userCoupon.usage_count });
          } else if (userCoupon.coupon.coupon_start_date >= new Date()) {
            upcomingCoupons.push({ ...userCoupon.coupon, usage_count: userCoupon.usage_count });
          } else {
            validCoupons.push({ ...userCoupon.coupon, usage_count: userCoupon.usage_count });
          }
        });
        return {validCoupons, upcomingCoupons, expiredCoupons};
    }

    async saveNewCoupon(coupon: Coupon, locationId: number): Promise<Coupon> {

        return await getManager().transaction(async (transactionalEntityManager: EntityManager) => {
          try {
              const location = await transactionalEntityManager.findOneOrFail(Location, locationId);
              coupon.location = location;
              const dbCoupon = await transactionalEntityManager.save(Coupon, coupon);

              const users = await transactionalEntityManager.find(User);
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