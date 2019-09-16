import { Get, Controller, Body, Param, Post, Delete, Res } from '@nestjs/common';
import * as Spreedly from '../interfaces/spreedly-api';
import { Response as ServerResponse } from 'express-serve-static-core';
import { PaymentService, SpreedlyService } from '@tabify/services';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly spreedlyService: SpreedlyService,
  ) { }

  /**
   * Receives a gateway token, a payment method token, and an amount to pay,
   * returns the resulting transaction.
  @Post()
  makeGatewayPayment(
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
  */

  /**
   * Receives a location, a ticket id, a payment method token, an amount, and a tip to pay,
   * returns the resulting transaction.
   */
  @Post()
  makePayment(
    @Body('location') location: string,
    @Body('ticket') ticketId: string,
    @Body('token') paymentToken: string,
    @Body('amount') amount: number,
    @Body('tip') tip: number,
  ) {
    return this.spreedlyService.sendPayment(
      location,
      ticketId,
      paymentToken,
      amount,
      tip,
    );
  }

  /**
   * Adds a new gateway.
   */
  @Post('/gateway')
  addGateway() {
    return this.spreedlyService.createGateway('test');
  }

  /**
   * Adds a new gateway.
   */
  @Get('/gateway')
  getGateways() {
    return this.spreedlyService.getAllGateways();
  }

  /**
   * Returns all credit card info associated with the given user, the user id should be
   * used will be the same one provided from the auth.
   */
  @Get('method')
  async getPaymentMethods(@Res() res: ServerResponse) {
    const {
      locals: {
        auth: { uid },
      },
    } = res;
    const methods = await this.paymentService.readPaymentMethods(uid);
    res.send(methods);
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
  // @Post('/method')
  // addMethod(@Body('gateway') gatewayToken: string, @Body('method') methodToken: string) {
  //   return this.spreedlyService.storeGatewayPurchaseMethod(gatewayToken, methodToken);
  // }

  /**
   * Create a test credit card via Spreedly
   */
  @Post('/method')
  async postPaymentMethod(@Res() res: ServerResponse, @Body('details') details: any) {
    const {
      locals: {
        auth: { uid },
      },
    } = res;
    const method = await this.paymentService.createPaymentMethod(uid, details);
    res.send(method);
  }

  /**
   * Removes the payment method from both the thrid party and our database
   */
  @Delete('/method')
  async deletePaymentMethod(@Res() res: ServerResponse, @Body() method: any) {
    const {
      locals: {
        auth: { uid },
      },
    } = res;
    const deleteResult = await this.paymentService.deletePaymentMethod(uid, method);
    res.send(deleteResult);
  }
}
