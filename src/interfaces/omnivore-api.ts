import { ReceiverVariables } from './spreedly-api';

export interface CardInfo {
  cvc2: ReceiverVariables.CARD_VERIFICATION_VALUE;
  exp_month: ReceiverVariables.CARD_EXPIRATION_MONTH;
  exp_year: ReceiverVariables.CARD_EXPIRATION_YEAR;
  number: ReceiverVariables.CARD_NUMBER;
}

export interface TicketPaymentRequest {
  amount: number;
  card_info: CardInfo;
  tip: number;
  type: 'card_not_present';
}