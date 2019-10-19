import { Get, Controller, Body, Param, Post, Delete, Res } from '@nestjs/common';
import { PaymentMethodService, SpreedlyService, TicketService } from '@tabify/services';
import { User } from '../decorators/user.decorator';

@Controller('payment-methods')
export class PaymentMethodController {
  constructor(
    private paymentMethodService: PaymentMethodService,
  ) { }

  /**
   * Returns all credit card info associated with the given user, the user id
   * used will be the same one provided from the auth.
   */
  @Get()
  async getPaymentMethods(@User('uid') uid: string) {
    const methods = await this.paymentMethodService.readPaymentMethods(uid);
    return methods;
  }

  /**
   * Create a test credit card via Spreedly
   */
  @Post()
  async postPaymentMethod(
    @User('uid') uid: string,
    @Body('details') details: any,
  ) {
    const method = await this.paymentMethodService.createPaymentMethod(uid, details);
    return method;
  }

  /**
   * Removes the payment method from our database
   */
  @Delete()
  async deletePaymentMethod(
    @User('uid') uid: string,
    @Body() method: any,
  ) {
    const deleteResult = await this.paymentMethodService.deletePaymentMethod(uid, method);
    return deleteResult;
  }
}
