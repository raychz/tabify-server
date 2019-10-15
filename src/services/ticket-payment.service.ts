import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { getRepository } from 'typeorm';
import { TicketPayment, TicketPaymentStatus, Ticket, User } from '@tabify/entities';
import { SpreedlyService } from '@tabify/services';
import { TicketPaymentInterface } from '../interfaces';

@Injectable()
export class TicketPaymentService {
  constructor(private spreedlyService: SpreedlyService) { }

  async sendTicketPayment(uid: string, details: TicketPaymentInterface) {
    // Create a pending ticket payment
    const { id: ticketPaymentId } = await this.saveTicketPayment({
      ticket: { id: details.ticketId } as Ticket,
      ticket_payment_status: TicketPaymentStatus.PENDING,
      user: { uid } as User,
    });

    // Attempt to send the ticket payment via Spreedly
    let spreedlyResponse;
    try {
      spreedlyResponse = await this.spreedlyService.sendPayment(
        details.omnivoreLocationId,
        details.omnivoreTicketId,
        details.paymentMethodToken,
        details.amount,
        details.tip,
        `TABIFY${ticketPaymentId}`,
      );
    } catch (error) {
      // Something went wrong, so update the payment's status to failed
      await this.saveTicketPayment({
        id: ticketPaymentId,
        ticket_payment_status: TicketPaymentStatus.FAILED,
        message: JSON.stringify(error),
      });
      throw new InternalServerErrorException('An error occurred while sending the Spreedly payment.', error);
    }

    // Parse the Spreedly response for further error checking/handling
    const { transaction: { succeeded, response } } = spreedlyResponse;
    if (succeeded && response.status === 201) {
      // Things look good, so update the payment's status to succeeded
      return await this.saveTicketPayment({
        id: ticketPaymentId,
        ticket_payment_status: TicketPaymentStatus.SUCCEEDED,
        message: spreedlyResponse.transaction.message,
        transaction_token: spreedlyResponse.transaction.token,
        omnivore_response: spreedlyResponse.transaction.response,
      });
    } else {
      // Something went wrong, so update the payment's status to failed
      await this.saveTicketPayment({
        id: ticketPaymentId,
        ticket_payment_status: TicketPaymentStatus.FAILED,
        message: spreedlyResponse.transaction.message,
        transaction_token: spreedlyResponse.transaction.token,
        omnivore_response: spreedlyResponse.transaction.response,
      });
      throw new BadRequestException('This payment could not be processed.', JSON.stringify(spreedlyResponse));
    }
  }

  async saveTicketPayment(ticketPayment: TicketPayment) {
    const ticketPaymentRepo = await getRepository(TicketPayment);
    return await ticketPaymentRepo.save(ticketPayment);
  }
}
