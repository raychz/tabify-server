import { Get, Controller, Query, Res, Post, Body, Put, Param, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { FirebaseService, FraudPreventionCodeService, TicketService, OmnivoreService } from '@tabify/services';
import { User } from '../decorators/user.decorator';

@Controller('tickets')
export class TicketController {
  constructor(
    private readonly ticketService: TicketService,
    private readonly firebaseService: FirebaseService,
    private readonly fraudPreventionCodeService: FraudPreventionCodeService,
    private omnivoreService: OmnivoreService,
  ) { }

  @Get()
  async getTicket(
    @User('uid') uid: string,
    @Query() params: any,
  ) {
    const { ticket_number, ticket_status, location } = params;

    if (!ticket_number || !location) {
      throw new BadRequestException('Missing ticket and/or location');
    }

    const ticket = await this.ticketService.getTicket({ ticket_number, ticket_status, location });

    if (!ticket) {
      throw new NotFoundException('The requested ticket could not be found.');
    }

    return ticket;
  }

  @Post()
  async createTicket(@Body() body: any) {
    const { ticket_number, location, fraudPreventionCodeId } = body;

    // Get ticket data from Omnivore
    const omnivoreTicket = await this.omnivoreService.getTicket(
      location,
      ticket_number,
    );

    // Save ticket in our database
    const newTicket = await this.ticketService.createTicket(omnivoreTicket);

    return newTicket;
  }

  @Get('/items')
  async getTicketItems(
    @User('uid') uid: string,
    @Query() params: any,
  ) {
    const { ticket_number, location } = params;

    if (!ticket_number || !location) {
      throw new BadRequestException('Missing ticket and/or location');
    }

    const ticketObj = await this.ticketService.getTicket(
      { ticket_number, location },
    );

    if (!ticketObj) {
      throw new InternalServerErrorException('There was an error while getting your ticket items');
    }
    return ticketObj.items;
  }

  async addTicketItem(
    @User('uid') uid: string,
  ) { }

  /**
   * Opens `numberOfTickets` demo tickets on Virtual POS, up to a max of 25 at a time
   * @param numberOfTickets
   */
  @Post('demo-tickets')
  async openDemoTickets(@Param('numberOfTickets') numberOfTickets: number) {
    return await this.omnivoreService.openDemoTickets(numberOfTickets);
  }

  @Put(':ticketId/closeTicket')
  async closeTicket(
    @User('uid') uid: string,
    @Param('ticketId') ticketId: number,
  ) {
    const response = await this.ticketService.closeTicket(ticketId);
    return response;
  }

  // async removeTicketItem() {

  // }
}
