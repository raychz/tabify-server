import { Get, Controller, Query, Res, Post, Body, Put, Param, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { FirebaseService, FraudPreventionCodeService, TicketService, OmnivoreService, StoryService } from '@tabify/services';
import { User } from '../decorators/user.decorator';

@Controller('tickets')
export class TicketController {
  constructor(
    private readonly ticketService: TicketService,
    private readonly storyService: StoryService,
    private readonly firebaseService: FirebaseService,
    private readonly fraudPreventionCodeService: FraudPreventionCodeService,
    private omnivoreService: OmnivoreService,
  ) { }

  @Get()
  async getTicket(
    @User('uid') uid: string,
    @Query() params: any,
  ) {
    const { id, ticket_number, location } = params;

    if (!location && (!ticket_number || !id)) {
      throw new BadRequestException('Missing ticket number and/or location');
    }

    const ticket = await this.ticketService.getTicket(params, ['items', 'location', 'users', 'ticketTotal']);

    if (!ticket) {
      throw new NotFoundException('The requested ticket could not be found.');
    }

    return ticket;
  }

  @Post()
  async createTicket(@Body() body: any) {
    const { ticket_number, location } = body;

    // Get ticket data from Omnivore
    const omnivoreTicket = await this.omnivoreService.getTicket(
      location,
      ticket_number,
    );

    // Save ticket in our database
    const newTicket = await this.ticketService.createTicket(omnivoreTicket);

    // Save new story
    await this.storyService.saveStory(newTicket);

    // Add ticket to Firestore
    await this.firebaseService.addTicketToFirestore(newTicket);

    return newTicket;
  }

  /** Adds user to Tabify database ticket */
  @Post(':id/addDatabaseUser')
  async addUserToDatabaseTicket(
    @User('uid') uid: string,
    @Param('id') ticketId: number,
  ) {
    await this.ticketService.addUserToDatabaseTicket(ticketId, uid);
  }

  /** Adds user to Firestore ticket */
  @Post(':id/addFirestoreUser')
  async addUserToFirestoreTicket(
    @User('uid') uid: string,
    @Param('id') ticketId: number,
  ) {
    const user = await this.firebaseService.getUserInfo(uid);
    await this.firebaseService.addUserToFirestoreTicket(ticketId, user);
  }

  /** Add ticket number to fraud code */
  @Post(':id/fraudCode')
  async addTicketNumberToCode(
    @Param('id') ticketId: number,
    @Body() body: any,
  ) {
    const { fraudPreventionCodeId } = body;

    // Add ticket number to fraud code
    await this.fraudPreventionCodeService.addTicketNumberToCode(ticketId, fraudPreventionCodeId);
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
      { ticket_number, location }, ['items'],
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

  @Put(':id/closeTicket')
  async closeTicket(
    @User('uid') uid: string,
    @Param('id') ticketId: number,
  ) {
    const response = await this.ticketService.closeTicket(ticketId);
    return response;
  }

  // async removeTicketItem() {

  // }
}
