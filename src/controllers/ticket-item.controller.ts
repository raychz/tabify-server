import { Get, Controller, Query, Res, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { User } from '../decorators/user.decorator';
import { TicketItemService, AblyService } from '@tabify/services';

@Controller('tickets/:ticketId/items')
export class TicketItemController {
  constructor(
    private readonly ticketItemService: TicketItemService,
  ) { }

  /** Adds user to ticket item */
  @Post(':itemId/users/:ticketUserId')
  async addUserToTicketItem(
    @User('uid') uid: string,
    @Param('ticketId') ticketId: number,
    @Param('ticketUserId') ticketUserId: number,
    @Param('itemId') itemId: number,
  ) {
    ticketId = Number(ticketId);
    ticketUserId = Number(ticketUserId);
    itemId = Number(itemId);
    return await this.ticketItemService.addUserToTicketItems(uid, ticketUserId, [itemId], ticketId, true);
  }

  /** Removes user from ticket item */
  @Delete(':itemId/users/:ticketUserId')
  async removeUserFromTicketItem(
    @User('uid') uid: string,
    @Param('ticketId') ticketId: number,
    @Param('ticketUserId') ticketUserId: number,
    @Param('itemId') itemId: number,
  ) {
    ticketId = Number(ticketId);
    ticketUserId = Number(ticketUserId);
    itemId = Number(itemId);
    return await this.ticketItemService.removeUserFromTicketItems(uid, ticketUserId, [itemId], ticketId, true);
  }
}