import { ReceiverVariables } from './spreedly-api';

export interface CardInfo {
  cvc2: ReceiverVariables.CARD_VERIFICATION_VALUE;
  exp_month: ReceiverVariables.CARD_EXPIRATION_MONTH;
  exp_year: ReceiverVariables.CARD_EXPIRATION_YEAR;
  number: ReceiverVariables.CARD_NUMBER;
}

export interface TicketPaymentRequest {
  amount: number;
  card_info: string;
  tip: number;
  type: 'card_not_present';
}

export interface OmnivoreTicketItem {
  comment?: string;
  discounts?: any[];
  menu_item: string;
  modifiers?: any[];
  price_level?: string;
  price_per_unit?: number;
  quantity?: number;
}

export interface OmnivoreTicketDiscount {
  comment?: string;
  discount: string;
  value: number;
}

export type PaymentComplete = any;
export type Error = any;
