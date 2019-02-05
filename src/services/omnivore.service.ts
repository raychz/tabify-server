import { Injectable, HttpStatus } from '@nestjs/common';
import fetch from 'node-fetch';
import { Location as LocationEntity } from '../entity';
import { ILocation } from '../entity/location.entity';
import { getManager, EntityManager, getRepository } from 'typeorm';
import { ITicket } from '../entity/ticket.entity';
import { ITicketItem } from '../entity/ticket-item.entity';
import { LocationService } from './location.service';

@Injectable()
export class OmnivoreService {
  static readonly API_URL = 'https://api.omnivore.io/1.0';

  constructor(private locationService: LocationService) {}

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
        .into(LocationEntity)
        .values(locations.map(location => new LocationEntity(location)))
        .onConflict(`("omnivore_id") DO NOTHING`)
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
    };
    return ticket;
  }

  hasError(json: any): boolean {
    return !!json.error;
  }
}
