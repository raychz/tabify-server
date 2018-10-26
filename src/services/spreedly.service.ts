import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';

import * as Spreedly from '../interfaces';

@Injectable()
export class SpreedlyService {
  private static readonly SPREEDLY_API = 'https://core.spreedly.com/v1';

  private static readonly AUTH_PHRASE: string = [
    process.env.SPREEDLY_ENVIRONMENT_KEY as string,
    process.env.SPREEDLY_ACCESS_KEY as string,
  ].join(':');

  private static readonly AUTH_HEADER = `Basic ${Buffer.from(
    SpreedlyService.AUTH_PHRASE,
  ).toString('base64')}`;

  private async createSpreedlyRequest<T, B = {}>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: B,
  ): Promise<T> {
    const response = await fetch(
      `${SpreedlyService.SPREEDLY_API}${endpoint}.json`,
      {
        body: body ? JSON.stringify(body) : undefined,
        method,
        headers: {
          Authorization: SpreedlyService.AUTH_HEADER,
          'Content-Type': 'application/json',
        },
      },
    );

    return (await response.json()) as T;
  }

  /**
   * Returns all gateways for the current environment
   */
  public async getAllGateways() {
    return (await this.createSpreedlyRequest<Spreedly.GatewayListResponse>(
      '/gateways',
    )).gateways;
  }

  /**
   * Returns the payment method associated with the given token
   */
  public async createGatewayPurchase(
    gatewayToken: string,
    paymentMethodToken: string,
    amount: number,
    currency: string = 'USD',
  ) {
    return (await this.createSpreedlyRequest<Spreedly.TransactionResponse>(
      `/gateways/${gatewayToken}/purchase`,
      'POST',
      {
        transaction: {
          amount: String(amount),
          currency_code: currency,
          payment_method_token: paymentMethodToken,
        },
      },
    )).transaction;
  }

  /**
   * Returns all transactions for the current environment
   */
  public async getAllTransactions() {
    return (await this.createSpreedlyRequest<Spreedly.TransactionListResponse>(
      '/transactions',
    )).transactions;
  }

  /**
   * Returns all payment methods for the current auth environment
   */
  public async getAllPaymentMethods() {
    return await this.createSpreedlyRequest<Spreedly.TransactionListResponse>(
      '/payment_methods',
    );
  }

  /**
   * Returns the payment method associated with the given token
   */
  public async getPaymentMethod(token: string) {
    return (await this.createSpreedlyRequest<Spreedly.PaymentMethodResponse>(
      `/payment_methods/${token}`,
    )).payment_method;
  }

  /**
   * Creates a static card for test purposes using the test information in the Spreedly docs.
   * Do not add real CC info on the server.
   */
  public async createCreditCard() {
    return await this.createSpreedlyRequest<Spreedly.TransactionResponse>(
      '/payment_methods',
      'POST',
      {
        payment_method: {
          credit_card: {
            first_name: 'John',
            last_name: 'Doe',
            number: '4111111111111111',
            verification_value: '123',
            month: '10',
            year: '2030',
          },
          email: 'hi@use-tabify.app',
        },
      },
    );
  }
}
