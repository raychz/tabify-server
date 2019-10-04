import { Get, Controller, Query, Res, Post, Body, Put, Param } from '@nestjs/common';
import { Response as ServerResponse } from 'express-serve-static-core';
import { FirebaseService, FraudPreventionCodeService, TicketService, OmnivoreService } from '@tabify/services';

@Controller('ticket')
export class TicketController {
  constructor(
    private readonly ticketService: TicketService,
    private readonly firebaseService: FirebaseService,
    private readonly fraudPreventionCodeService: FraudPreventionCodeService,
    private omnivoreService: OmnivoreService,
  ) { }

  @Get()
  async getTicket(@Res() res: ServerResponse, @Query() params: any) {
    const { ticket_number, location, fraudPreventionCodeId } = params;
    const {
      locals: {
        auth: { uid },
      },
    } = res;

    if (!ticket_number || !location || !fraudPreventionCodeId) {
      res.status(400);
      res.send({
        message: 'Missing ticket, location, or fraud prevention code',
      });
      return;
    }

    const user = await this.firebaseService.getUserInfo(uid);
    const ticketObj = await this.ticketService.getTicket(
      location,
      ticket_number,
      user,
    );

    if (!ticketObj || !ticketObj.id) {
      res.status(500);
      res.send({
        message: 'There was an error getting your ticket',
      });
      return;
    }

    await this.fraudPreventionCodeService.addTicketNumberToCode(ticketObj.id, fraudPreventionCodeId);

    res.send(ticketObj);
  }

  @Get('/items')
  async getTicketItems(@Res() res: ServerResponse, @Query() params: any) {
    const { ticket_number, location } = params;
    const {
      locals: {
        auth: { uid },
      },
    } = res;

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
      uid,
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

  async addTicketItem(@Res() res: ServerResponse) {
    const {
      locals: {
        auth: { uid },
      },
    } = res;
  }

  /**
   * Opens `numberOfTickets` demo tickets on Virtual POS, up to a max of 25 at a time
   * @param numberOfTickets
   */
  @Post()
  async openDemoTickets(@Param('numberOfTickets') numberOfTickets: number) {
    return await this.omnivoreService.openDemoTickets(numberOfTickets);
  }

  @Put(':ticketId/closeTicket')
  async closeTicket(
    @Res() res: ServerResponse,
    @Param('ticketId') ticketId: number,
  ) {
    const response = await this.ticketService.closeTicket(ticketId);
    res.send(response);
  }

  // async removeTicketItem() {

  // }
}
