export interface TicketPaymentInterface {
    omnivoreLocationId: string;
    omnivoreTicketId: string;
    ticketId: number;
    paymentMethodToken: string;
    amount: number;
    tip: number;
    comment?: string;
}
