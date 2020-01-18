import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { getRepository } from 'typeorm';
import { TicketPayment, Ticket, User, Server } from '@tabify/entities';
import { SpreedlyService, TicketService } from '@tabify/services';
import { TicketPaymentInterface } from '../interfaces';
import { TicketTotalService } from './ticket-total.service';
import { TicketPaymentStatus } from '../enums';
import { SMSService } from './sms.service';

@Injectable()
export class TicketPaymentService {
  constructor(
    private spreedlyService: SpreedlyService,
    private ticketService: TicketService,
    private ticketTotalService: TicketTotalService,
    private messageService: SMSService,
  ) { }

  async sendTicketPayment(uid: string, details: TicketPaymentInterface) {
    // Create a pending ticket payment
    const { id: ticketPaymentId } = await this.saveTicketPayment({
      ticket: details.ticket,
      ticket_payment_status: TicketPaymentStatus.PENDING,
      user: { uid } as User,
      amount: details.amount,
      tip: details.tip,
    });

    // Attempt to send the ticket payment via Spreedly
    let spreedlyResponse;
    try {
      spreedlyResponse = await this.spreedlyService.sendPayment(
        details.ticket.location!.omnivore_id!,
        details.ticket.tab_id!,
        details.paymentMethodToken,
        details.amount,
        details.tip,
        `TABIFY${ticketPaymentId}`,
      );
    } catch (error) {
      Logger.error(error);
      // Something went wrong, so update the payment's status to failed

      // send error sms to server
      this.sendPaymentFailSMSToServer(details);

      await this.saveTicketPayment({
        id: ticketPaymentId,
        ticket_payment_status: TicketPaymentStatus.FAILED,
        message: JSON.stringify(error),
      });
      throw new InternalServerErrorException('An error occurred while sending the Spreedly payment.', error);
    }

    // Parse the Spreedly response for further error checking/handling
    const { transaction, transaction: { succeeded, response } } = spreedlyResponse;
    if (succeeded && response.status === 201) {
      // Things look good, so update the payment's status to succeeded
      await this.saveTicketPayment({
        id: ticketPaymentId,
        ticket_payment_status: TicketPaymentStatus.SUCCEEDED,
        message: transaction.message,
        transaction_token: transaction.token,
        omnivore_response: JSON.stringify(response),
        amount: response.body.amount,
        tip: response.body.tip,
        omnivore_id: response.body.id,
      });
    } else {
      Logger.error(spreedlyResponse, 'Error occurred while parsing the Spreedly response');

      // send error sms to server
      this.sendPaymentFailSMSToServer(details);

      // Something went wrong, so update the payment's status to failed
      await this.saveTicketPayment({
        id: ticketPaymentId,
        ticket_payment_status: TicketPaymentStatus.FAILED,
        message: transaction.message,
        transaction_token: transaction.token,
        omnivore_response: JSON.stringify(response),
      });
      throw new BadRequestException('This payment could not be processed.', JSON.stringify(spreedlyResponse));
    }

    // Update the ticket totals
    const { body: { _embedded: { ticket: responseTicket } } } = response;
    if (responseTicket) {
      await this.ticketTotalService.updateTicketTotals({
        id: details.ticket.ticketTotal!.id,
        discounts: responseTicket.totals.discounts,
        due: responseTicket.totals.due,
        items: responseTicket.totals.items,
        other_charges: responseTicket.totals.other_charges,
        paid: responseTicket.totals.paid,
        service_charges: responseTicket.totals.service_charges,
        sub_total: responseTicket.totals.sub_total,
        tax: responseTicket.totals.tax,
        tips: responseTicket.totals.tips,
        total: responseTicket.totals.total,
      });
    } else {
      Logger.error(response, 'Error occurred while parsing the Omnivore response');

      // send error sms to server
      this.sendPaymentFailSMSToServer(details);
      throw new BadRequestException('This payment could not be processed.', response);
    }

    // Check if Omnivore is reporting the ticket as closed or balance due is $0
    if (responseTicket.open === false || responseTicket.totals.due === 0) {
      // The ticket has been closed on Omnivore, so close the ticket on the database
      await this.ticketService.closeTicket(details.ticket.id!);

      /*
      TODO: Get all payments submitted for this ticket and save any that are not present in our database
      This will allow us to check for non-Tabify payments, like cash and card-present transactions
      Note that this will only work if all the cash or card-present transactions happen BEFORE the Tabify transactions
      This can be fixed with polling of the ticket and synchronizing the payments
      */
    }

    /*
    TODO: Remove this hack once Omnivore has fixed on their end.
    Omnivore's test tickets always include a service charge fee of $5. This hack will check for the service fee
    and submit a $5 payment if it is the only item due
    */
    if (details.ticket.location!.omnivore_id === 'i8yBgkjT' && responseTicket.totals.due === 500 && responseTicket.totals.service_charges === 500) {
      await this.sendTicketPayment(uid, {
        amount: 500,
        paymentMethodToken: details.paymentMethodToken,
        ticket: details.ticket,
        tip: 0,
      });
    }

    // Get updated ticket total and join with the ticket
    const updatedTicketTotals = await this.ticketTotalService.getTicketTotals(details.ticket.id!, ['ticket']);

    return updatedTicketTotals;
  }

  // send error sms to server
  async sendPaymentFailSMSToServer(details: TicketPaymentInterface) {
    if (details.ticket.server && details.ticket.server.phone) {
      const server = details.ticket.server;
      const tableName = details.ticket.table_name;

      const section1 = `Ticket #${details.ticket.ticket_number} just had a payment issue with Tabify.`;
      const section2 = ` Please assist the patrons and verify that the ticket gets paid in full.`;
      const section3 = tableName ? ` Table/Revenue Center: ${tableName}.` : '';
      const section4 = server ? ` Server: ${server.firstName}.` : '';
      const textMsg = section1 + section2 + section3 + section4;

      this.messageService.sendSMS(server.phone, textMsg);
    }
  }

  async saveTicketPayment(ticketPayment: TicketPayment) {
    const ticketPaymentRepo = await getRepository(TicketPayment);
    return await ticketPaymentRepo.save(ticketPayment);
  }
}
