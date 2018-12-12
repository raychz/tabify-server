import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import fetch, { Response } from 'node-fetch';

import * as Spreedly from '../interfaces';

interface APIError { // Identical to the nest error response format
  error: string;
  message: string;
  statusCode: number;
}

function isSpreedlyError(value: any): value is Spreedly.APIError {
  return value && (typeof value.key === 'string') && (typeof value.message === 'string');
}

function isSpreedlyErrorResponse(value: any): value is Spreedly.ErrorResponse {
  return value
    && value.errors
    && Array.isArray(value.errors)
    && value.errors.every(isSpreedlyError);
}

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

  private async createSpreedlyRequest<B = {}>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: B,
  ): Promise<Response> {
    return await fetch(
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
  }

  private async handleSpreedlyResponse<T>(request: Promise<Response>): Promise<T> {
    const response = await request;

    const json = await (response.json() as Promise<T | Spreedly.ErrorResponse>);

    if (isSpreedlyErrorResponse(json)) {
      const statusCode = (response.status < 200) || (response.status > 299)
        ? response.status
        : 400;

      const error: APIError = {
        statusCode,
        error: (statusCode === 400) ? 'Bad Request' : response.statusText,
        message: json.errors.length ? json.errors[0].message : 'API Gateway Error',
      };

      throw new HttpException(error, statusCode);
    }

    return json;
  }

  /**
   * Returns all gateways for the current environment
   */
  public async getAllGateways() {
    return (await this.handleSpreedlyResponse<Spreedly.GatewayListResponse>(
      this.createSpreedlyRequest('/gateways')
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
    return (await this.handleSpreedlyResponse<Spreedly.TransactionResponse>(
      this.createSpreedlyRequest(
        `/gateways/${gatewayToken}/purchase`,
        'POST',
        {
          transaction: {
            amount: String(amount),
            currency_code: currency,
            payment_method_token: paymentMethodToken,
          },
        },
      )
    )).transaction;
  }

  /**
   * Returns all transactions for the current environment
   */
  public async getAllTransactions() {
    return (await this.handleSpreedlyResponse<Spreedly.TransactionListResponse>(
      this.createSpreedlyRequest('/transactions')
    )).transactions;
  }

  /**
   * Returns all payment methods for the current auth environment
   */
  public async getAllPaymentMethods() {
    return await (this.handleSpreedlyResponse<Spreedly.TransactionListResponse>(
      this.createSpreedlyRequest('/payment_methods')
    ));
  }

  /**
   * Returns the payment method associated with the given token
   */
  public async getPaymentMethod(token: string) {
    return (await this.handleSpreedlyResponse<Spreedly.PaymentMethodResponse>(
      this.createSpreedlyRequest(`/payment_methods/${token}`)
    )).payment_method;
  }

  /**
   * Creates a static card for test purposes using the test information in the Spreedly docs.
   * Do not add real CC info on the server.
   */
  public async createCreditCard() {
    return await this.handleSpreedlyResponse<Spreedly.TransactionResponse>(
      this.createSpreedlyRequest(
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
      )
    );
  }
}
