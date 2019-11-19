import { Get, Controller, Query, Res, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { User } from '../decorators/user.decorator';
import { TicketItemService, AblyService } from '@tabify/services';

@Controller('tickets/:ticketId/items')
export class TicketItemController {
  constructor(
    private readonly ticketItemService: TicketItemService,
    private readonly ablyService: AblyService,
  ) { }

  /** Adds user to ticket item */
  @Post(':itemId/users')
  async addUserToTicketItem(
    @User('uid') uid: string,
    @Param('itemId') itemId: number,
  ) {
    return await this.ticketItemService.addUserToTicketItem(uid, itemId);
    // const ticketUser = await this.ticketUserService.addUserToTicket(ticketId, uid);
    // await this.ablyService.publish(TicketUpdates.TICKET_USER_ADDED, ticketUser, ticketId.toString());
    // return ticketUser;
  }

  /** Removes user from ticket item */
  @Delete(':itemId/users')
  async removeUserFromTicketItem(
    @User('uid') uid: string,
    @Param('itemId') itemId: number,
  ) {
    return await this.ticketItemService.removeUserFromTicketItem(uid, itemId);
    // const ticketUser = await this.ticketUserService.addUserToTicket(ticketId, uid);
    // await this.ablyService.publish(TicketUpdates.TICKET_USER_ADDED, ticketUser, ticketId.toString());
    // return ticketUser;
  }
}