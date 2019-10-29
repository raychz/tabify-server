import { Injectable, BadRequestException } from '@nestjs/common';
import { getRepository, getConnection } from 'typeorm';
import { TicketItem as TicketItemEntity, Ticket as TicketEntity } from '@tabify/entities';
import { FirebaseService } from '@tabify/services';

@Injectable()
export class TicketItemService {

    constructor(
        private readonly firebaseService: FirebaseService,
    ) { }

    /**
     * gets a ticket, along with all its items, item users, users' details and payments
     * associated with that ticket
     */
    async getTicketItems(ticketId: number) {
        const ticketRepo = await getRepository(TicketEntity);

        const ticketItems = await ticketRepo.findOneOrFail({
            where: { id: ticketId },
            relations: ['items', 'items.users', 'items.users.userDetail', 'ticketPayments', 'ticketPayments.user'],
        });

        return ticketItems;
    }

    /**
     * save which user got which item in the database (ticket_item_users_user)
     * @param ticketId number
     */
    async saveTicketItemUsers(ticketId: number) {
        const _ticketItems = await this.firebaseService.retrieveTicketItemUsers(ticketId);
        const ticketItems: any = [];
        _ticketItems.forEach(doc => {
            ticketItems.push(doc.data());
        });

        // go through each ticketItem
        ticketItems.forEach(async (item: any) => {

            // store uids for each item
            // go through all users per item
            const userIds: number[] = item.users.map((user: any) => user.uid);

            // add users/ticketItem pairs to database
            try {
                await getConnection()
                    .createQueryBuilder()
                    .relation(TicketItemEntity, 'users')
                    .of(item.id)
                    .add(userIds);
            } catch (e) {
                const { code } = e;
                if (code !== 'ER_DUP_ENTRY') {
                    throw new BadRequestException('An unknown error occurred. Please try again.', e);
                }
            }
        });
    }
}