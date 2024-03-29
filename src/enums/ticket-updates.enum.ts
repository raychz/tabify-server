export enum TicketUpdates {
    /** Used to bundle multiple messages together */
    MULTIPLE_UPDATES = 'MULTIPLE_UPDATES',

    // Ticket-related updates
    /** The stats of the ticket changed and should be represented as such */
    TICKET_UPDATED = 'TICKET_UPDATED',

    // TicketUser-related updates
    /** A new user should be pushed to the client's representation of ticket users. */
    TICKET_USER_ADDED = 'TICKET_USER_ADDED',
    /** A new user should be spliced from the client's representation of ticket users. */
    TICKET_USER_REMOVED = 'TICKET_USER_REMOVED',
    /** One or more users should be replaced in the client's representation of ticket users. */
    TICKET_USERS_UPDATED = 'TICKET_USERS_UPDATED',

    // TicketItemUser-related updates
    /** All ticket item users should be replaced in the client's representation of ticket item users. */
    TICKET_ITEM_USERS_REPLACED = 'TICKET_ITEM_USERS_REPLACED',

    // TicketTotal-related updates
    TICKET_TOTALS_UPDATED = 'TICKET_TOTALS_UPDATED',

    TICKET_PAYMENTS_UPDATED = 'TICKET_PAYMENTS_UPDATED',
}
