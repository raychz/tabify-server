import { Get, Controller, Body, Param, Post, Delete } from '@nestjs/common';
import { PaymentService } from 'services/payment.service';
import { SpreedlyService } from 'services/spreedly.service';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly appService: PaymentService,
    private readonly spreedlyService: SpreedlyService,
  ) {}

  /**
   * Receives a gateway token, a payment method token, and an amount to pay,
   * returns the resulting transaction.
   */
  @Post()
  makePayment(
    @Body('gateway') gateway: string,
    @Body('payment_method') paymentMethod: string,
    @Body('amount') amount: number,
  ) {
    return this.spreedlyService.createGatewayPurchase(
      gateway,
      paymentMethod,
      amount,
    );
  }

  /**
   * Returns all credit card info associated with the given user, the user id should be
   * used will be the same one provided from the auth.
   */
  @Get('method')
  getPaymentMethods() {
    return this.spreedlyService.getAllGateways();
  }

  /**
   * Returns payment method information associated with a given payment method token.
   */
  @Get('method/:token')
  getPaymentMethod(@Param('token') token: string) {
    return this.spreedlyService.getPaymentMethod(token);
  }

  /**
   * Add a new payment method to a third party using the credit card info
   * and the userid from the auth
   */
  @Post('/method')
  addMethod() {}

  /**
   * Removes the payment method from both the thrid party and our database
   */
  @Delete('/method')
  deleteMethod() {}
}
