import { Get, Controller, Body, Param, Post, Delete, Res, Logger } from '@nestjs/common';
import { PaymentMethodService, SpreedlyService, TicketService, TicketPaymentService, CouponService } from '@tabify/services';
import { User } from '../decorators/user.decorator';
import { Ticket, Coupon, ApplicableCoupon } from '@tabify/entities';

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
    @Body('applicableCouponId') applicableCouponId?: number,
  ) {
    const paymentMethod = await this.paymentMethodService.readPaymentMethod(uid, paymentMethodId);
    const { token: paymentMethodToken } = paymentMethod!;
    const ticket = await this.ticketService.getTicket({ id: ticketId }, ['location', 'ticketTotal']) as Ticket;

    let applicableCoupon: ApplicableCoupon | undefined;
    if (applicableCouponId) {
      applicableCoupon = await this.couponService.applyDiscount(applicableCouponId, ticket, uid);
      Logger.log(`original amount to pay: ${amount}`);
      amount -= applicableCoupon.estimated_tax_difference;
      Logger.log(`amount to pay after coupon: ${amount}`);
    }

    const updatedTotal = await this.ticketPaymentService.sendTicketPayment(uid, {
      ticket,
      paymentMethodToken,
      amount,
      tip,
      applicableCoupon,
    });

    return updatedTotal;
  }
}
