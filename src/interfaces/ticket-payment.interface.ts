import { Ticket, Coupon, ApplicableCoupon } from '@tabify/entities';

export interface TicketPaymentInterface {
    ticket: Ticket;
    paymentMethodToken: string;
    amount: number;
    tip: number;
    applicableCoupon?: ApplicableCoupon;
    comment?: string;
}
