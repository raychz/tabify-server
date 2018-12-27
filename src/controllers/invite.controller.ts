import { Get, Post, Controller } from '@nestjs/common';

@Controller('invite')
export class InviteController {
  constructor() {}

  /**
   * Receives a list of phone numbers and sends an invite
   */
  @Post()
  async sendInvite() {}

  /**
   * Given a phone number and a ticket number share an app
   * link
   */
  @Post()
  async shareTicket() {}
}