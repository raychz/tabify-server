import { Get, Controller, Query, Res, Post, Body, Put, Param } from '@nestjs/common';
import { User } from '../decorators/user.decorator';
import { TicketUserService, AblyService } from '@tabify/services';
import { TicketUpdates } from '../enums';

@Controller('tickets/:ticketId/users')
export class TicketUserController {
  constructor(
    private readonly ticketUserService: TicketUserService,
    private readonly ablyService: AblyService,
  ) { }

  /** Adds user to Tabify database ticket */
  @Post()
  async addUserToDatabaseTicket(
    @User('uid') uid: string,
    @Param('ticketId') ticketId: number,
  ) {
    const ticketUser = await this.ticketUserService.addUserToTicket(ticketId, uid);
    await this.ablyService.publish(TicketUpdates.TICKET_USER_ADDED, ticketUser, ticketId.toString());
    return ticketUser;
  }
}
