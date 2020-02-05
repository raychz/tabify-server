import { Get, Controller, Query, Res, Post, Body, Put, Param, Patch, BadRequestException, Delete } from '@nestjs/common';
import { User } from '../decorators/user.decorator';
import { TicketUserService, TicketItemService } from '@tabify/services';
import { TicketUserStatus } from '../enums';
import { getRepository } from 'typeorm';
import { TicketItemUser, TicketItem, TicketUser, Ticket } from '@tabify/entities';

@Controller('tickets/:ticketId/users')
export class TicketUserController {
  constructor(
    private readonly ticketUserService: TicketUserService,
    private readonly ticketItemService: TicketItemService,
  ) { }

  /** Adds user to Tabify database ticket */
  @Post()
  async addUserToDatabaseTicket(
    @User('uid') uid: string,
    @Param('ticketId') ticketId: number,
  ) {
    const ticketUser = await this.ticketUserService.addUserToTicket(ticketId, uid, true);
    return ticketUser;
  }

  /** Delete user from Tabify database ticket */
  @Delete()
  async removeUserFromDatabaseTicket(
    @User('uid') uid: string,
    @Param('ticketId') ticketId: number,
  ) {
    const ticketUser = await this.ticketItemService.removeUserFromTicket(ticketId, uid, true);
    return ticketUser;
  }

  /** Delete user from Tabify database ticket */
  @Delete('/:ticketUserId')
  async removeUserFromAllItemsOnTicket(
    @User('uid') uid: string,
    @Param('ticketId') ticketId: number,
    @Param('ticketUserId') ticketUserId: number,
  ) {
    ticketId = Number(ticketId);
    const ticketItemRepo = await getRepository(TicketItem);
    const items = await ticketItemRepo.find({ ticket: { id: ticketId } });
    const itemIds: number[] = [];
    items.forEach(item => {
      itemIds.push(Number(item.id));
    });
    return await this.ticketItemService.removeUserFromTicketItem(uid, ticketUserId, itemIds, ticketId, true);
  }

  @Patch()
  async updateTicketUserStatus(
    @User('uid') uid: string,
    @Param('ticketId') ticketId: number,
    @Body('ticketUserId') ticketUserId: number,
    @Body('status') status: string,
  ) {
    const newUserStatus: TicketUserStatus = status as TicketUserStatus;
    if (!Object.values(TicketUserStatus).includes(newUserStatus)) {
      throw new BadRequestException('Invalid ticket user status.');
    }
    return await this.ticketUserService.updateTicketUserStatus(ticketId, ticketUserId, newUserStatus, true);
  }
}
