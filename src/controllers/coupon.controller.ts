import { Controller, Get } from '@nestjs/common';
import { CouponService } from '@tabify/services';

@Controller('coupons')
export class CouponController {
  constructor(
    private readonly couponService: CouponService,
  ) { }

  @Get()
  async getCoupons() {
    const coupons = await this.couponService.getCoupons();
    return coupons;
  }
}