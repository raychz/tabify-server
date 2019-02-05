import {
  Get,
  Controller,
  Query,
  Res,
  Post,
  Body,
} from '@nestjs/common';
import { TicketService } from '../services/ticket-service';
import { Response as ServerResponse } from 'express-serve-static-core';
// import { IoServer } from 'modules/socket/socket-server';

@Controller('ticket')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get()
  async getTicket(@Res() res: ServerResponse, @Query() params: any) {
    const { ticket_number, location } = params;

    if (!ticket_number || !location) {
      res.status(400);
      res.send({
        message: 'Missing ticket and/or Location',
      });
      return;
    }

    const ticketObj = await this.ticketService.getTicket(
      location,
      ticket_number,
    );

    if (!ticketObj) {
      res.status(500);
      res.send({
        message: 'There was an error getting your ticket',
      });
      return;
    }

    res.send(ticketObj);
  }

  @Get('/items')
  async getTicketItems(@Res() res: ServerResponse, @Query() params: any) {
    const { ticket_number, location } = params;
    if (!ticket_number || !location) {
      res.status(400);
      res.send({
        message: 'Missing ticket and/or Location',
      });
      return;
    }

    const ticketObj = await this.ticketService.getTicket(
      location,
      ticket_number,
    );

    if (!ticketObj) {
      res.status(500);
      res.send({
        message: 'There was an error getting your ticket',
      });
      return;
    }
    res.send(ticketObj.items);
  }
}
