import { Get, Controller, Query, Res, Post, Body, Put, Param, BadRequestException, NotFoundException, NotImplementedException, HttpStatus, Logger } from '@nestjs/common';
import { FirebaseService, FraudPreventionCodeService, TicketService, OmnivoreService, StoryService, TicketUserService } from '@tabify/services';
import { User } from '../decorators/user.decorator';
import { Response } from 'express';
import { MoreThanOrEqual } from 'typeorm';

@Controller('tickets')
export class TicketController {
  constructor(
    private readonly ticketService: TicketService,
    private readonly storyService: StoryService,
    private readonly firebaseService: FirebaseService,
    private readonly fraudPreventionCodeService: FraudPreventionCodeService,
    private omnivoreService: OmnivoreService,
  ) { }

  @Get(':id')
  async getTicketById(
    @User('uid') uid: string,
    @Param('id') id: any,
  ) {
    if (!id) {
      throw new BadRequestException('Missing ticket id');
    }

    const ticket = await this.ticketService.getTicket({ id },
      ['items', 'items.users', 'location', 'users', 'users.user', 'users.user.userDetail', 'ticketTotal'],
    );

    if (!ticket) {
      throw new NotFoundException('The requested ticket could not be found.');
    }

    return ticket;
  }

  @Get()
  async getTicket(
    @User('uid') uid: string,
    @Query() params: any,
  ) {
    const { opened_recently, id, ticket_number, location } = params;

    // get ticket that was created in the last 6 hours
    if (opened_recently && Boolean(JSON.parse(opened_recently))) {
      const date = new Date();
      date.setUTCHours(date.getUTCHours() - 6);
      params.date_created = MoreThanOrEqual(date);
    }
    delete params.opened_recently;

    if (!location && (!ticket_number || !id)) {
      throw new BadRequestException('Missing ticket number and/or location');
    }

    const ticket = await this.ticketService.getTicket(params,
      ['items', 'items.users', 'items.users.user', 'items.users.user.userDetail', 'location', 'users',
      'users.selected_coupon', 'users.user', 'users.user.userDetail', 'ticketTotal'],
    );

    if (!ticket) {
      throw new NotFoundException('The requested ticket could not be found.');
    }

    return ticket;
  }

  @Post()
  async createTicket(@Body() body: any, @Res() res: Response) {
    const { ticket_number, location, opened_recently } = body;

    // Get ticket data from Omnivore
    const omnivoreTicket = await this.omnivoreService.getTicketByTicketNumber(
      location,
      ticket_number,
    );

    const openedRecently = opened_recently && Boolean(JSON.parse(opened_recently));
    // Create ticket in our database
    const { created, ticket: newTicket } = await this.ticketService.createTicket(omnivoreTicket, openedRecently,
      ['items', 'items.users', 'server', 'items.users.user', 'items.users.user.userDetail', 'location', 'users', 'users.user',
      'users.selected_coupon', 'users.user.userDetail', 'ticketTotal'],
    );

    if (created) {
      // Save new story
      await this.storyService.saveStory(newTicket);

      // Add ticket to Firestore
      // const ticketId = await this.firebaseService.addTicketToFirestore(newTicket);
      // newTicket.firestore_doc_id = ticketId;
      // await this.ticketService.updateTicket(newTicket);

      res.status(HttpStatus.CREATED).send(newTicket);
    } else {
      res.status(HttpStatus.OK).send(newTicket);
    }
  }

  /** Adds user to Firestore ticket */
  @Post(':id/addFirestoreUser')
  async addUserToFirestoreTicket(
    @User('uid') uid: string,
    @Param('id') ticketId: number,
  ) {
    const user = await this.firebaseService.getUserInfo(uid);
    // const firestoreDocumentId = await this.ticketService.getTicketFirestoreId(ticketId);
    // await this.firebaseService.addUserToFirestoreTicket(firestoreDocumentId, user);
  }

  /** Finalize totals for each user on Firestore */
  @Post(':id/finalizeTotals')
  async finalizeTotals(
    @User('uid') uid: string,
    @Param('id') ticketId: number,
  ) {
    // const firestoreDocumentId = await this.ticketService.getTicketFirestoreId(ticketId);
    // return await this.firebaseService.finalizeUserTotals(firestoreDocumentId);
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
    throw new NotImplementedException('This endpoint should not be called. See the ticket-item.controller.ts class.');
    // const { ticket_number, location } = params;

    // if (!ticket_number || !location) {
    //   throw new BadRequestException('Missing ticket and/or location');
    // }

    // const ticketObj = await this.ticketService.getTicket(
    //   { ticket_number, location }, ['items'],
    // );

    // if (!ticketObj) {
    //   throw new InternalServerErrorException('There was an error while getting your ticket items');
    // }
    // return ticketObj.items;
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
}
