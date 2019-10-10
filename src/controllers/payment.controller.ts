import { Get, Controller, Body, Param, Post, Delete, Res } from '@nestjs/common';
import { PaymentMethodService, SpreedlyService, TicketService } from '@tabify/services';
import { User } from '../decorators/user.decorator';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentMethodService,
    private readonly spreedlyService: SpreedlyService,
    private readonly ticketService: TicketService,
  ) { }

  /**
   * Receives a location, a ticket id, a payment method id, an amount, and a tip to pay,
   * returns the resulting transaction.
   */
  @Post()
  async makePayment(
    @User('uid') uid: string,
    @Body('ticketId') ticketId: string,
    @Body('paymentMethodId') paymentMethodId: number,
    @Body('amount') amount: number,
    @Body('tip') tip: number,
  ) {

    console.log({
      ticketId,
      paymentMethodId,
      amount,
      tip,
    });

    // const ticket = await this.ticketService.getTicket()
    const paymentMethod = await this.paymentService.readPaymentMethod(uid, paymentMethodId);
    console.log('GIVEN PAYMENT METHOD', paymentMethod);
    // return this.spreedlyService.sendPayment(
    //   location,
    //   ticketId,
    //   paymentMethodId,
    //   amount,
    //   tip,
    // );
    return paymentMethod;
  }
}
