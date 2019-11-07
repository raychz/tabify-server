import { Get, Controller, Query, Res, Post, Body, Put, Param } from '@nestjs/common';
import { User } from '../decorators/user.decorator';
import { TicketUserService } from '@tabify/services';

@Controller('tickets/:ticketId/users')
export class TicketUserController {
  constructor(private readonly ticketUserService: TicketUserService) { }

  /** Adds user to Tabify database ticket */
  @Post()
  async addUserToDatabaseTicket(
    @User('uid') uid: string,
    @Param('ticketId') ticketId: number,
  ) {
    return await this.ticketUserService.addUserToTicket(ticketId, uid);
  }
}