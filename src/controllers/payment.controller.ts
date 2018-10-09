import { Get, Controller, Post, Delete } from '@nestjs/common';
import { PaymentService } from 'services/payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly appService: PaymentService) {}

  /**
   * Shoud receive a paymnet method and an amount, should query a third party given a userid
   * for the payment method hash and use the value to make payment request to omnivore.
   */
  @Post()
  makePayment(): string {
    return 'post payment';
  }

  /**
   * Returns all credit card info associated with the given user, the user id should be
   * used will be the same one provided from the auth.
   */
  @Get('method')
  getPaymentMethods(): any[] {
    return [];
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
