import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CouponService, TicketService } from '@tabify/services';
import { User } from '../decorators/user.decorator';
import { Coupon, Ticket } from '@tabify/entities';

@Controller('coupons')
export class CouponController {
  constructor(
    private readonly couponService: CouponService,
    private readonly ticketService: TicketService,
  ) { }

  @Get()
  async getCoupons(
    @User('uid') uid: string,
  ) {
    const coupons = await this.couponService.getCoupons(uid);
    return coupons;
  }

  @Get('ticket/:ticketId')
  async getApplicableCoupons(
    @User('uid') uid: string,
    @Param('ticketId') ticketId: number,
  ) {
    const ticket = await this.ticketService.getTicket({ id: ticketId },
      ['location', 'ticketTotal', 'users', 'items', 'items.users', 'users.user', 'items.users.user']) as Ticket;
    const coupons = await this.couponService.getCoupons(uid, ticket!.location!.id);
    coupons.validCoupons = await this.couponService.getApplicableTicketUserCoupons(coupons.validCoupons, ticket, uid);
    return coupons;
  }

  @Post('location/:locationOmnivoreId')
  async saveNewCoupon(
    @Param('locationOmnivoreId') locationOmnivoreId: string,
    @Body('newCoupon') newCoupon: Coupon,
  ) {
    newCoupon.coupon_end_date = new Date(newCoupon.coupon_end_date);
    newCoupon.coupon_start_date = new Date(newCoupon.coupon_start_date);
    return await this.couponService.saveNewCoupon(newCoupon, locationOmnivoreId);
  }
}