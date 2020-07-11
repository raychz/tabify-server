import { TicketItemUser } from '@tabify/entities';

export interface ItemIdToTicketItemUsersSet {
    [itemId: number]: Set<TicketItemUser>;
}