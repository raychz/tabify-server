import { Get, Controller, Post, Delete, Param, Query, Res, Req } from '@nestjs/common';
import { TicketService } from 'services/ticket-service';

@Controller('ticket')
export class TicketController {

  constructor(private readonly ticketService: TicketService) {
    
  }

  @Get()
  async getTicket(@Res() res, @Query() params) {
    const { ticket, location } = params;
    if (!ticket || !location) {
      res.status(400);
      res.send({
        message: 'Missing ticket and/or Location',
      });
    }
    return this.ticketService.getTicket(location, ticket);
  }

}