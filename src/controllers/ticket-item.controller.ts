import { Get, Controller, Query, Res, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { User } from '../decorators/user.decorator';
import { TicketItemService, AblyService } from '@tabify/services';

@Controller('tickets/:ticketId/items')
export class TicketItemController {
  constructor(
    private readonly ticketItemService: TicketItemService,
  ) { }

  /** Adds user to ticket item */
  @Post(':itemId/users')
  async addUserToTicketItem(
    @User('uid') uid: string,
    @Param('ticketId') ticketId: number,
    @Param('itemId') itemId: number,
  ) {
    ticketId = Number(ticketId);
    itemId = Number(itemId);
    return await this.ticketItemService.addUserToTicketItem(uid, itemId, ticketId, true);
  }

  /** Removes user from ticket item */
  @Delete(':itemId/users')
  async removeUserFromTicketItem(
    @User('uid') uid: string,
    @Param('ticketId') ticketId: number,
    @Param('itemId') itemId: number,
  ) {
    ticketId = Number(ticketId);
    itemId = Number(itemId);
    return await this.ticketItemService.removeUserFromTicketItem(uid, itemId, ticketId, true);
  }
}