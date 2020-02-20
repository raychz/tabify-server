import { TicketItemUser } from '@tabify/entities';

export interface ItemIdToTicketItemUsersArray {
    [itemId: number]: TicketItemUser[];
}