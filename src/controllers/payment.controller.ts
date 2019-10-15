import { Get, Controller, Body, Param, Post, Delete, Res } from '@nestjs/common';
import { PaymentMethodService, SpreedlyService, TicketService, LocationService } from '@tabify/services';
import { User } from '../decorators/user.decorator';

@Controller('tickets/:ticketId/payments')
export class PaymentController {
  constructor(
    private readonly paymentMethodService: PaymentMethodService,
    private readonly spreedlyService: SpreedlyService,
    private readonly ticketService: TicketService,
    private readonly locationService: LocationService,
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
  ) {
    const paymentMethod = await this.paymentMethodService.readPaymentMethod(uid, paymentMethodId);
    const { token } = paymentMethod!;
    const ticket = await this.ticketService.getTicket({ id: ticketId }, ['location']);
    const { location: { omnivore_id: omnivoreLocationId }, tab_id: omnivoreTicketId } = ticket!;

    const spreedlyResponse = await this.spreedlyService.sendPayment(
      omnivoreLocationId,
      omnivoreTicketId,
      token,
      amount,
      tip,
    );

    return spreedlyResponse;
  }
}
