import { TicketItemUser } from '@tabify/entities';

export interface ItemIdToTicketItemUsers {
    itemId: number;
    ticketItemUsers: Set<TicketItemUser>;
}