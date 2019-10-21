import { Ticket } from '@tabify/entities';

export interface TicketPaymentInterface {
    ticket: Ticket;
    paymentMethodToken: string;
    amount: number;
    tip: number;
    comment?: string;
}
