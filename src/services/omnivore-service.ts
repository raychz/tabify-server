import { Injectable, HttpStatus } from '@nestjs/common';
import fetch from 'node-fetch';

export type OmnivorePaymentType = 'card' | '';
export interface IOmnivoreTicketItem {
  id: number;
  name: string;
  comment: string;
  price: number;
  quantity: number;
  sent: boolean;
  sent_at?: number;
  split: number;
}

export interface IOmnivoreTicketPayment {
  id: number;
  amount: number;
  change: number;
  comment: number;
  full_name: number;
  last4: number;
  status?: any;
  tip: number;
  type: OmnivorePaymentType;
}

export interface IOmnivoreTicket {
  id: number;
  name: string;
  open: boolean;
  opened_at: boolean;
  ticket_number: number;
  items: IOmnivoreTicketItem[];
  payments: IOmnivoreTicketPayment[];
}

@Injectable()
export class OmnivoreService {
  static readonly API_URL = 'https://api.omnivore.io/1.0';
  getLocations() {
  }

  /**
   * @description Loads a single ticket from the omnivore api given
   * a location and ticket number
   * @param location
   * @param ticket_number
   */
  async getTicket(location: string, ticket_number: string) {
    const headers = {
      'Content-Type': 'application/json',
      'Api-Key': process.env.OMNIVORE_API_KEY || '',
    };

    const url = `${OmnivoreService.API_URL}/locations/${location}/tickets/${ticket_number}`;
    const res = await fetch(url, { headers });
    const json = await res.json();

    if (this.hasError(json) || res.status !== HttpStatus.OK) {
      throw Error('Failed fetching ticket from source');
    }

    const ticket: IOmnivoreTicket = {
      id: json.id,
      name: json.name,
      open: json.open,
      opened_at: json.opened_at,
      ticket_number: json.ticket_number,
      items: json._embedded.items.map((item: Partial<IOmnivoreTicketItem>) => ({
        id: item.id,
        name: item.name,
        comment: item.comment,
        price: item.price,
        quantity: item.quantity,
        sent: item.sent,
        sent_at: item.sent_at,
        split: item.split,
      })),
      payments: json._embedded.payments.map((payment: Partial<IOmnivoreTicketPayment>) => ({
        id: payment.id,
        amount: payment.amount,
        change: payment.change,
        comment: payment.comment,
        full_name: payment.full_name,
        last4: payment.last4,
        status: payment.status,
        tip: payment.tip,
        type: payment.type,
      })),
    };
    return ticket;
  }

  hasError(json: any): boolean {
    return !!json.error;
  }
}