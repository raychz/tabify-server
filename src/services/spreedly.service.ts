import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import fetch, { Response } from 'node-fetch';

import * as Omnivore from '../interfaces/omnivore-api';
import * as Spreedly from '../interfaces/spreedly-api';

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
   * Sends a payment to the given omnivore location ID and ticket ID using the provided Spreedly payment token
   * @param {string}        locationId   The location ID the ticket belongs to
   * @param {string}        ticketId     The ticket ID to receive the payment
   * @param {string}        paymentToken The token for the payment method to use
   * @param {number}        amount       The amount (in USD) to be paid against the ticket
   * @param {number = 0.0}  tip The amount (in USD) to be added as a ticket
   */
  public async sendPayment(locationId: string, ticketId: string, paymentToken: string, amount: number, tip: number = 0.0) {
    // This is the response from Spreedly (assuming handleSpreedlyResponse didn't throw)
    const json = (await this.handleSpreedlyResponse<Spreedly.TransactionResponse>(
      this.createSpreedlyRequest(
        `/receivers/${encodeURIComponent(process.env.SPREEDLY_RECEIVER_TOKEN as string)}/deliver`,
        'POST',
        {
          delivery: {
            payment_method_token: paymentToken,
            url: `https://api.omnivore.io/1.0/locations/${encodeURIComponent(locationId)}/tickets/${encodeURIComponent(ticketId)}/payments`,
            headers: `Content-Type: application/json;\r\nApi-Key: ${encodeURIComponent(process.env.OMNIVORE_API_KEY as string)}`,
            body: `{
              "amount": ${JSON.stringify(amount)},
              "tip": ${JSON.stringify(tip)},
              "card_info": {
                "cvc2": "${Spreedly.ReceiverVariables.CARD_VERIFICATION_VALUE}",
                "exp_month": ${Spreedly.ReceiverVariables.CARD_EXPIRATION_MONTH},
                "exp_year": ${Spreedly.ReceiverVariables.CARD_EXPIRATION_YEAR},
                "number": "${Spreedly.ReceiverVariables.CARD_NUMBER}"
              },
              "type": "card_not_present"
            }`,
          }
        },
      )
    ));

    // This extracts the response from the Omnivore server (provided as a string in transaction.response.body)
    return JSON.parse(json.transaction.response.body as string) as (Omnivore.PaymentComplete | Omnivore.Error);
  }

  /**
   * Returns all receivers created for the current environment
   */
  public async getReceivers() {
    return (await this.handleSpreedlyResponse(this.createSpreedlyRequest('/receivers')));
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
        `/gateways/${encodeURIComponent(gatewayToken)}/purchase`,
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
   * Creates a gateway of the specified type
   * @param {string} gatewayType The type of Spreedly gateway to create
   */
  public async createGateway(gatewayType: string) {
    return (await this.handleSpreedlyResponse<Spreedly.TransactionResponse>(
      this.createSpreedlyRequest(`/gateways`, 'POST', {
        gateway: {
          gateway_type: gatewayType,
        },
      }),
    ));
  }

  /**
   * Stores the given paymentMethod in the vault for the given gateway.
   * @param {string} gatewayToken  The gateway to associate the payment method with.
   * @param {string} paymentMethod The payment method to associate.
   */
  public async storeGatewayPurchaseMethod(gatewayToken: string, paymentMethod: string) {
    return (await this.handleSpreedlyResponse<Spreedly.TransactionResponse>(
      this.createSpreedlyRequest(
        `/gateways/${encodeURIComponent(gatewayToken)}/store`,
        'POST',
        { transaction: { payment_method_token: paymentMethod } },
      )
    ));
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
