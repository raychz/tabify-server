import { Get, Controller, Query, Res, Post, Body, Put, Param, BadRequestException, InternalServerErrorException } from '@nestjs/common';
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
    const { ticket_number, location, fraudPreventionCodeId } = params;

    if (!ticket_number || !location || !fraudPreventionCodeId) {
      throw new BadRequestException('Missing ticket, location, or fraud prevention code');
    }

    const user = await this.firebaseService.getUserInfo(uid);
    const ticketObj = await this.ticketService.getTicket(
      location,
      ticket_number,
    );

    if (!ticketObj || !ticketObj.id) {
      throw new InternalServerErrorException('There was an error while getting your ticket');
    }

    await this.fraudPreventionCodeService.addTicketNumberToCode(ticketObj.id, fraudPreventionCodeId);

    return ticketObj;
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
      location,
      ticket_number,
    );

    if (!ticketObj) {
      throw new InternalServerErrorException('There was an error while getting your ticket items');
    }
    return ticketObj.items;
  }

  async addTicketItem(
    @User('uid') uid: string,
  ) {}

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
    @User('uid') uid: string,
    @Param('ticketId') ticketId: number,
  ) {
    const response = await this.ticketService.closeTicket(ticketId);
    return response;
  }

  // async removeTicketItem() {

  // }
}
