import { Controller, Get, Post, Body, Param, Query, Logger } from '@nestjs/common';
import { CouponService, TicketItemService, TicketUserService, TicketTotalService } from '@tabify/services';
import { User } from '../decorators/user.decorator';
import { Coupon, TicketUser, TicketTotal } from '@tabify/entities';

@Controller('coupons')
export class CouponController {
  constructor(
    private readonly couponService: CouponService,
    private readonly ticketItemService: TicketItemService,
    private readonly ticketUserService: TicketUserService,
    private readonly ticketTotalService: TicketTotalService,
  ) { }

  @Get()
  async getCoupons(
    @User('uid') uid: string,
  ) {
    const userCoupons = await this.couponService.getUserCoupons(uid);
    const coupons = this.couponService.groupCoupons(userCoupons);
    return coupons;
  }

  @Get('ticket/:ticketId')
  async getApplicableCoupons(
    @User('uid') uid: string,
    @Param('ticketId') ticketId: number,
  ) {
    const ticketItems = await this.ticketItemService.getTicketItems(ticketId, uid);
    const ticketUser = await this.ticketUserService.getTicketUser(ticketId, uid) as TicketUser;
    const userCoupons = await this.couponService.getUserCoupons(uid, ticketUser!.ticket!.location!.id);
    const ticketTotals = await this.ticketTotalService.getTicketTotals(ticketId) as TicketTotal;
    const coupons = this.couponService.assignTicketUserApplicableCoupons(ticketUser, userCoupons, ticketItems, ticketTotals);
    return coupons;
    // const userCoupons = await this.couponService.getUserCoupons(uid, locationId);
    // const coupons = this.couponService.userCouponsToCoupons(userCoupons);
    // return coupons;
  }

  @Post('location/:locationOmnivoreId')
  async saveNewCoupon(
    @Param('locationOmnivoreId') locationOmnivoreId: string,
    @Body('newCoupon') newCoupon: Coupon,
  ) {
    return await this.couponService.saveNewCoupon(newCoupon, locationOmnivoreId);
  }
}