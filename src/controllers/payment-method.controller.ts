import { Get, Controller, Body, Param, Post, Delete, Res } from '@nestjs/common';
import * as Spreedly from '../interfaces/spreedly-api';
import { Response as ServerResponse } from 'express-serve-static-core';
import { PaymentMethodService, SpreedlyService, TicketService } from '@tabify/services';

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
  async getPaymentMethods(@Res() res: ServerResponse) {
    const {
      locals: {
        auth: { uid },
      },
    } = res;
    const methods = await this.paymentMethodService.readPaymentMethods(uid);
    res.send(methods);
  }

  /**
   * Create a test credit card via Spreedly
   */
  @Post()
  async postPaymentMethod(@Res() res: ServerResponse, @Body('details') details: any) {
    const {
      locals: {
        auth: { uid },
      },
    } = res;
    const method = await this.paymentMethodService.createPaymentMethod(uid, details);
    res.send(method);
  }

  /**
   * Removes the payment method from our database
   */
  @Delete()
  async deletePaymentMethod(@Res() res: ServerResponse, @Body() method: any) {
    const {
      locals: {
        auth: { uid },
      },
    } = res;
    const deleteResult = await this.paymentMethodService.deletePaymentMethod(uid, method);
    res.send(deleteResult);
  }
}
