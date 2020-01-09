import { Ticket, Coupon } from '@tabify/entities';

export interface TicketPaymentInterface {
    ticket: Ticket;
    paymentMethodToken: string;
    amount: number;
    tip: number;
    coupon?: Coupon;
    comment?: string;
}
