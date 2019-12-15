import { Get, Controller, Body, Param, Post, Delete, Res } from '@nestjs/common';
import { PaymentMethodService, SpreedlyService, TicketService, TicketPaymentService } from '@tabify/services';
import { User } from '../decorators/user.decorator';
import { Ticket, Coupon } from '@tabify/entities';

@Controller('tickets/:ticketId/payments')
export class PaymentController {
  constructor(
    private readonly paymentMethodService: PaymentMethodService,
    private readonly ticketService: TicketService,
    private readonly ticketPaymentService: TicketPaymentService,
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
    @Body('coupon') coupon?: Coupon,
  ) {
    const paymentMethod = await this.paymentMethodService.readPaymentMethod(uid, paymentMethodId);
    const { token: paymentMethodToken } = paymentMethod!;
    const ticket = await this.ticketService.getTicket({ id: ticketId }, ['location', 'ticketTotal']) as Ticket;

    const updatedTotal = await this.ticketPaymentService.sendTicketPayment(uid, {
      ticket,
      paymentMethodToken,
      amount,
      tip,
      coupon,
    });

    return updatedTotal;
  }
}
