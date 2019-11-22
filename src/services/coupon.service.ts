import { Injectable, BadRequestException } from '@nestjs/common';
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

        return userCoupons.map( userCoupon => userCoupon.coupon);
    }

    async saveNewCoupon(coupon: Coupon, locationId: number) {

        await getManager().transaction(async (transactionalEntityManager: EntityManager) => {
            const location = new Location();
            location.id = locationId;
            coupon.location = location;
            const dbCoupon = await transactionalEntityManager.save(Coupon, coupon);

            const users = await transactionalEntityManager.find(User);
            users.forEach(user => {
                transactionalEntityManager.insert(UserToCoupons, {usage_count: 0, user, coupon: dbCoupon});
            });
            try {
              transactionalEntityManager.queryRunner!.commitTransaction();
            } catch (error) {
              transactionalEntityManager.queryRunner!.rollbackTransaction();
            }
          });
    }
}