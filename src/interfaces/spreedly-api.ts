import { Nullable } from './nullable';

export enum ReceiverVariables {
  CARD_TOKEN = '{{credit_card_token}}',
  CARD_NUMBER = '{{credit_card_number}}',
  CARD_VERIFICATION_VALUE = '{{credit_card_verification_value}}',
  CARD_FIRST_NAME = '{{credit_card_first_name}}',
  CARD_LAST_NAME = '{{credit_card_last_name}}',
  CARD_EXPIRATION_MONTH = '{{credit_card_month}}',
  CARD_EXPIRATION_YEAR = '{{credit_card_year}}',
}

export interface APIError {
  key: string;
  message: string;
}

export interface ErrorResponse {
  errors: APIError[];
}

type RootResponse<E extends string, T> = { [key in E]: T };
type ListResponse<E extends string, T> = { [key in E]: T[] };

interface TimeTrackedToken {
  created_at: string;
  updated_at: string;
  token: string;
}

export type GatewayCharacteristic =
  | 'purchase'
  | 'authorize'
  | 'capture'
  | 'credit'
  | 'general_credit'
  | 'void'
  | 'verify'
  | 'reference_purchase'
  | 'offsite_purchase'
  | 'offsite_authorize'
  | '3dsecure_purchase'
  | '3dsecure_authorize'
  | 'store'
  | 'remove'
  | 'reference_authorization';

export type PaymentMethodType =
  | 'android_pay'
  | 'apple_pay'
  | 'bank_account'
  | 'credit_card'
  | 'sprel'
  | 'third_party_token';

export type TransactionState =
  | 'succeeded'
  | 'failed'
  | 'gateway_processing_failed'
  | 'gateway_processing_result_unknown';

export type GatewayResponseDetails = any;

// A thing which can receive payment/perform refunds
export interface Gateway extends TimeTrackedToken {
  characteristics: GatewayCharacteristic[];
  credentials: string[];
  description: Nullable<string>;
  gateway_specific_fields: string[];
  gateway_type: string;
  name: string;
  payment_methods: PaymentMethodType[];
  redacted: boolean;
  state: string;
}

export type GatewayResponse = RootResponse<'gateway', Gateway>;
export type GatewayListResponse = ListResponse<'gateways', Gateway>;

export interface ShippingAddress {
  address1: Nullable<string>;
  address2: Nullable<string>;
  city: Nullable<string>;
  country: Nullable<string>;
  name: string;
  phone_number: Nullable<string>;
  state: Nullable<string>;
  zip: Nullable<string>;
}

// A thing used to perform payment
export interface PaymentMethod extends ShippingAddress, TimeTrackedToken {
  card_type: string;
  company: Nullable<string>;
  data: Nullable<any>;
  eligible_for_card_updater: Nullable<boolean>;
  email: Nullable<string>;
  errors: any[];
  fingerprint: Nullable<string>;
  first_name: string;
  first_six_digits: string;
  full_name: string;
  last_four_digits: string;
  last_name: string;
  metadata: Nullable<any>;
  month: number;
  number: string;
  payment_method_type: PaymentMethodType;
  shipping_address1: Nullable<string>;
  shipping_address2: Nullable<string>;
  shipping_city: Nullable<string>;
  shipping_state: Nullable<string>;
  shipping_zip: Nullable<string>;
  shipping_country: Nullable<string>;
  shipping_phone_number: Nullable<string>;
  storage_state: string;
  test: boolean;
  verification_value: string;
  year: number;
}

export type PaymentMethodResponse = RootResponse<
  'payment_method',
  PaymentMethod
>;
export type PaymentMethodListResponse = ListResponse<
  'payment_methods',
  PaymentMethod
>;

// Captures actions performed against the API/payments against gateways
// TODO: Create a BaseTransaction for common fields, and break out the optional
// fields into interfaces for each situation
export interface Transaction extends TimeTrackedToken {
  amount?: number;
  api_urls?: Array<{ referencing_transaction: any[] }>;
  basis_payment_method?: PaymentMethod;
  currency_code?: string;
  description?: Nullable<string>;
  email?: Nullable<string>;
  gateway?: Gateway;
  gateway_specific_fields?: any;
  gateway_specific_response_fields?: any;
  gateway_transaction_id?: number;
  gateway_latency_ms?: number;
  gateway_token?: string;
  gateway_type?: string;
  ip?: Nullable<string>;
  merchant_name_descriptor?: any;
  merchant_location_descriptor?: any;
  message: string;
  message_key: string;
  order_id?: Nullable<string>;
  on_test_gateway?: boolean;
  payment_method?: PaymentMethod;
  payment_method_added?: boolean;
  response?: GatewayResponseDetails;
  retain_on_success?: boolean;
  shipping_address?: ShippingAddress;
  state: TransactionState;
  succeeded: boolean;
  transaction_type: string;
}

export type TransactionResponse = RootResponse<'transaction', Transaction>;
export type TransactionListResponse = ListResponse<'transactions', Transaction>;

// Used for transferring data between third parties/other API stuff
export interface Certificate extends TimeTrackedToken {
  algorithm: string;
  c: string;
  cn: string;
  csr: string;
  email_address: string;
  l: string;
  o: string;
  ou: string;
  pem: string;
  public_key: string;
  st: string;
}

export type CertificateResponse = RootResponse<'certificate', Certificate>;
export type CertificateListResponse = ListResponse<'certificates', Certificate>;
