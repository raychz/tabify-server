import { Injectable, HttpStatus } from '@nestjs/common';
import { getManager, EntityManager, getRepository } from 'typeorm';
import fetch from 'node-fetch';
import { ILocation, ITicket, ITicketItem, Location as LocationEntity } from '@tabify/entities';
import { LocationService } from '@tabify/services';
import { sleep } from '../utilities/general.utilities';
import { ITicketServiceCharge } from '../entity/ticket-service-charge.entity';

@Injectable()
export class OmnivoreService {
  static readonly API_URL = 'https://api.omnivore.io/1.0';

  constructor(private locationService: LocationService) { }

  async getLocations(): Promise<ILocation[]> {
    const headers = {
      'Content-Type': 'application/json',
      'Api-Key': process.env.OMNIVORE_API_KEY || '',
    };

    const url = `${OmnivoreService.API_URL}/locations`;
    const res = await fetch(url, { headers });
    const json = await res.json();

    if (this.hasError(json) || res.status !== HttpStatus.OK) {
      throw Error('Failed fetching ticket from source');
    }

    return (json._embedded.locations as Array<any>).map(
      (location: any): ILocation => ({
        name: location.name,
        longitude: location.longitude,
        latitude: location.latitude,
        website: location.website,
        zip: location.address.zip,
        city: location.address.city,
        country: location.address.country,
        state: location.address.state,
        street1: location.address.street1,
        street2: location.address.street2,
        timezone: location.timezone,
        omnivore_id: location.id,
        phone: location.phone,
        google_place_id: location.google_place_id,
        tickets: [],
        servers: [],
      }),
    );
  }

  public async syncLocations(): Promise<void> {
    // gets all locations from omnivore,
    // if we already have it in our db we ignore it, else we add it.

    const locations = await this.getLocations();

    await getManager().transaction(async (transactionalEntityManager: EntityManager) => {
      transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .orIgnore()
        .into(LocationEntity)
        .values(locations.map(location => new LocationEntity(location)))
        // .onConflict(`("omnivore_id") DO NOTHING`)
        .execute();
      try {
        transactionalEntityManager.queryRunner!.commitTransaction();
      } catch (error) {
        transactionalEntityManager.queryRunner!.rollbackTransaction();
      }
    });
  }

  /**
   * @description Loads a single ticket from the omnivore api given
   * a location id and ticket number
   * @param omnivoreLocationId
   * @param ticket_number
   */
  async getTicket(omnivoreLocationId: string, ticketNumber: string): Promise<ITicket> {
    const location = await this.locationService.getLocation({
      where: {
        omnivore_id: omnivoreLocationId,
      },
    }) as ILocation;

    if (!location) {
      throw Error('Location not found');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Api-Key': process.env.OMNIVORE_API_KEY || '',
    };

    const url = `${
      OmnivoreService.API_URL
      }/locations/${omnivoreLocationId}/tickets/${ticketNumber}`;

    const res = await fetch(url, { headers });
    const json = await res.json();

    if (this.hasError(json) || res.status !== HttpStatus.OK) {
      throw Error('Failed fetching ticket from source');
    }

    const ticket: ITicket = {
      tab_id: json.id,
      location,
      ticket_number: json.ticket_number,
      items: json._embedded.items.map((item: ITicketItem) => ({
        ticket_item_id: item.id,
        name: item.name,
        comment: item.comment,
        price: item.price,
        quantity: item.quantity,
        sent: item.sent,
        sent_at: item.sent_at,
        split: item.split,
      })),
      service_charges: json._embedded.service_charges.map((service_charge: ITicketServiceCharge) => ({
        omnivore_id: service_charge.id,
        comment: service_charge.comment,
        name: service_charge.name,
        price: service_charge.price,
      })),
    };
    return ticket;
  }

  async openDemoTickets(numberOfTicketsRequested: number = 25): Promise<number[]> {
    // Only allow up to 25 virtual POS tickets to be created at a time
    const numberOfTicketsToCreate = Math.min(numberOfTicketsRequested, 25);

    const virtualPosId = 'i8yBgkjT';

    const headers = {
      'Content-Type': 'application/json',
      'Api-Key': process.env.OMNIVORE_API_KEY || '',
    };

    const url = `${
      OmnivoreService.API_URL
      }/locations/${virtualPosId}/tickets/`;

    const body = {
      employee: '100',
      order_type: '1',
      revenue_center: '1',
      items: [
        {
          menu_item: '101',
          quantity: 3,
        },
        {
          menu_item: '102',
          quantity: 5,
        },
        {
          menu_item: '201',
          quantity: 3,
        },
        {
          menu_item: '202',
          quantity: 1,
        },
        {
          menu_item: '203',
          quantity: 1,
        },
        {
          menu_item: '204',
          quantity: 1,
        },
        {
          menu_item: '206',
          quantity: 1,
        },
        {
          menu_item: '207',
          quantity: 1,
        },
        {
          menu_item: '208',
          quantity: 1,
        },
        {
          menu_item: '209',
          quantity: 1,
        },
      ],
    };

    const ticketNumbers = [];
    for (let i = 0; i < numberOfTicketsToCreate; i++) {
      await sleep(50);
      const res = await fetch(url, { headers, method: 'POST', body: JSON.stringify(body) });
      const json = await res.json();

      if (this.hasError(json) || res.status !== HttpStatus.CREATED) {
        throw Error('Failed to open the ticket');
      }
      ticketNumbers.push(json.ticket_number);
    }
    return ticketNumbers;
  }

  hasError(json: any): boolean {
    return !!json.error;
  }
}
