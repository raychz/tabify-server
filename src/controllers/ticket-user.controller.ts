import { Get, Controller, Query, Res, Post, Body, Put, Param, Patch, BadRequestException } from '@nestjs/common';
import { User } from '../decorators/user.decorator';
import { TicketUserService } from '@tabify/services';
import { TicketUserStatus } from '../enums';

@Controller('tickets/:ticketId/users')
export class TicketUserController {
  constructor(
    private readonly ticketUserService: TicketUserService,
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
    return this.ticketUserService.updateTicketUserStatus(ticketId, ticketUserId, newUserStatus, true);
  }
}
