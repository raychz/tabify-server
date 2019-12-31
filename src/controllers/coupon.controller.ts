import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CouponService } from '@tabify/services';
import { User } from '../decorators/user.decorator';
import { Coupon } from '@tabify/entities';

@Controller('coupons')
export class CouponController {
  constructor(
    private readonly couponService: CouponService,
  ) { }

  @Get()
  async getCoupons(
    @User('uid') uid: string,
  ) {
    const coupons = await this.couponService.getCoupons(uid);
    return coupons;
  }

  @Post('location/:locationId')
  async saveNewCoupon(
    @Param('locationOmnivoreId') locationOmnivoreId: string,
    @Body('newCoupon') newCoupon: Coupon,
  ) {
    return await this.couponService.saveNewCoupon(newCoupon, locationOmnivoreId);
  }
}