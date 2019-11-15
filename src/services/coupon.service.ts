import { Injectable, BadRequestException } from '@nestjs/common';
import { getConnection, getRepository } from 'typeorm';
import { Coupon as CouponEntity } from '@tabify/entities';

@Injectable()
export class CouponService {

    constructor() { }

    // get all comments from the server
    async getCoupons() {
        const couponsRepo = await getRepository(CouponEntity);
        const coupons = await couponsRepo.find();

        return coupons;
    }
}