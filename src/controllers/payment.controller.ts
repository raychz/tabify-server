import { Get, Controller, Body, Param, Post, Delete, Res, Logger } from '@nestjs/common';
import { PaymentMethodService, SpreedlyService, TicketService, TicketPaymentService, CouponService } from '@tabify/services';
import { User } from '../decorators/user.decorator';
import { Ticket, Coupon } from '@tabify/entities';

@Controller('tickets/:ticketId/payments')
export class PaymentController {
  constructor(
    private readonly paymentMethodService: PaymentMethodService,
    private readonly ticketService: TicketService,
    private readonly ticketPaymentService: TicketPaymentService,
    private readonly couponService: CouponService,
  ) { }

  /**
   * Receives a location, a ticket id, a payment method id, an amount, and a tip to pay,
   * returns the resulting transaction.
   */
  @Post()
  async makePayment(
    @User('uid') uid: string,
    @Param('ticketId') ticketId: number,
    @Body('paymentMethodId') paymentMethodId: number,
    @Body('amount') amount: number,
    @Body('tip') tip: number,
    @Body('couponId') couponId?: number,
  ) {
    const paymentMethod = await this.paymentMethodService.readPaymentMethod(uid, paymentMethodId);
    const { token: paymentMethodToken } = paymentMethod!;
    const ticket = await this.ticketService.getTicket({ id: ticketId },
      ['location', 'ticketTotal', 'users', 'server', 'items', 'users.selected_coupon', 'items.users',
      'users.user', 'users.user.userDetail', 'items.users.user']) as Ticket;

    let coupon: Coupon | undefined;
    if (couponId) {
      const response = await (await this.couponService.applyDiscount(couponId, ticket, uid));
      coupon = response.coupon;
      amount -= (response.res.dollar_value + response.res.taxDifference);
    }

    const updatedTotal = await this.ticketPaymentService.sendTicketPayment(uid, {
      ticket,
      paymentMethodToken,
      paymentMethodId,
      amount,
      tip,
      coupon,
    });

    return updatedTotal;
  }

  @Get()
  async getTicketPaymentsForUser(
    @User('uid') uid: string,
    @Param('ticketId') ticketId: number,
  ) {
    const res = await this.ticketPaymentService.getTicketPaymentsByUser(ticketId, uid);
    return res;
  }
}
