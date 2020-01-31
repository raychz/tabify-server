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
    return await this.ticketItemService.addUserToTicketItem(uid, ticketUserId, itemId, ticketId, true);
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
    return await this.ticketItemService.removeUserFromTicketItem(uid, ticketUserId, itemId, ticketId, true);
  }

  /**
   * get ticket items for logged in user, for a ticket
   */
  @Get('/user')
  async getTicketItemsForUser(
    @User('uid') uid: string,
    @Param('ticketId') ticketId: number,
  ) {
    return await this.ticketItemService.getTicketItemsForUser(ticketId, uid);
  }
}