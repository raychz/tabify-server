export enum TicketUserStatus {
    SELECTING = 'SELECTING',
    WAITING = 'WAITING',
    CONFIRMED = 'CONFIRMED',
    PAYING = 'PAYING',
    PAID = 'PAID',
}

export const TicketUserStatusOrder = {
    [TicketUserStatus.SELECTING]: 1,
    [TicketUserStatus.WAITING]: 2,
    [TicketUserStatus.CONFIRMED]: 3,
    [TicketUserStatus.PAYING]: 4,
    [TicketUserStatus.PAID]: 5,
};
