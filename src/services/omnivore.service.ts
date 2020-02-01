import { Injectable, HttpStatus, NotFoundException, BadGatewayException, InternalServerErrorException, UnprocessableEntityException, BadRequestException } from '@nestjs/common';
import { getManager, EntityManager } from 'typeorm';
import fetch from 'node-fetch';
import { Location as LocationEntity, Ticket, TicketItem } from '@tabify/entities';
import { LocationService } from '@tabify/services';
import { sleep } from '../utilities/general.utilities';
import { OmnivoreTicketItem, OmnivoreTicketDiscount } from '@tabify/interfaces';
import { ServerService } from './server.service';

@Injectable()
export class OmnivoreService {
  static readonly API_URL = 'https://api.omnivore.io/1.0';

  constructor(
    private locationService: LocationService,
    private serverService: ServerService,
  ) { }

  async getLocations(): Promise<LocationEntity[]> {
    const headers = {
      'Content-Type': 'application/json',
      'Api-Key': process.env.OMNIVORE_API_KEY_DEV || '',
    };

    const url = `${OmnivoreService.API_URL}/locations`;
    const res = await fetch(url, { headers });
    const json = await res.json();

    if (this.hasError(json) || res.status !== HttpStatus.OK) {
      throw Error('Failed fetching ticket from source');
    }

    return (json._embedded.locations as Array<any>).map(
      (location: any): LocationEntity => ({
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
        .values(locations)
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
   * Loads a single ticket from the Omnivore API given a location id and ticket number
   * @param omnivoreLocationId
   * @param ticket_number
   */
  async getTicketByTicketNumber(locationId: number, ticketNumber: number): Promise<Ticket> {
    const location = await this.locationService.getLocation({
      where: {
        id: locationId,
      },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    const apiKey = location.omnivore_id === 'i8yBgkjT' ? process.env.OMNIVORE_API_KEY_DEV : process.env.OMNIVORE_API_KEY_PROD;
    const headers = {
      'Content-Type': 'application/json',
      'Api-Key': apiKey!,
    };

    // Omnivore query args used here. See https://panel.omnivore.io/docs/api/1.0/queries
    const where = `and(eq(open,true),eq(ticket_number,${encodeURIComponent(String(ticketNumber))}))`;
    const fields = `totals,@employee,@revenue_center,ticket_number,@items(price,name,quantity,comment,sent,sent_at,split)`;
    const url = `${OmnivoreService.API_URL}/locations/${location.omnivore_id}/tickets?where=${where}&fields=${fields}`;
    const res = await fetch(url, { headers });
    const json = await res.json();

    if (res.status === HttpStatus.NOT_FOUND) {
      throw new NotFoundException('The ticket could not be found in Omnivore.');
    }

    if (this.hasError(json) || res.status !== HttpStatus.OK) {
      throw new BadGatewayException('Failed fetching ticket from source');
    }

    const { _embedded: { tickets } } = json;

    if (tickets.length > 1) {
      throw new InternalServerErrorException('Multiple open tickets correspond to this ticket number.');
    }

    if (tickets.length === 0) {
      throw new NotFoundException('No open tickets correspond to this ticket number.');
    }

    const [customerTicket] = tickets;

    // TODO: Support tickets with service/other charges
    if (location.omnivore_id !== 'i8yBgkjT' && customerTicket.totals.service_charges > 0 || customerTicket.totals.other_charges > 0) {
      throw new UnprocessableEntityException('Tickets with service/other charges are not currently supported.');
    }

    // use the employee.id to find server in our DB. If this is undefined, the serverId field in 
    // the ticket will be null
    const employee = customerTicket._embedded.employee;
    const employeeId = employee ? employee.id : undefined;
    const serverToAssociate = await this.serverService
      .getServerByEmployeeId(employeeId);

    const ticket: Ticket = {
      tab_id: customerTicket.id,
      location,
      ticket_number: customerTicket.ticket_number,
      items: customerTicket._embedded.items.map((item: TicketItem | any) => ({
        ticket_item_id: item.id,
        name: item.name,
        comment: item.comment,
        price: item.price,
        quantity: item.quantity,
        sent: item.sent,
        sent_at: item.sent_at,
        split: item.split,
      })),
      ticketTotal: {
        discounts: customerTicket.totals.discounts,
        due: customerTicket.totals.due,
        items: customerTicket.totals.items,
        other_charges: customerTicket.totals.other_charges,
        paid: customerTicket.totals.paid,
        service_charges: customerTicket.totals.service_charges,
        sub_total: customerTicket.totals.sub_total,
        tax: customerTicket.totals.tax,
        tips: customerTicket.totals.tips,
        total: customerTicket.totals.total,
      },
      server: serverToAssociate,
      table_name: customerTicket._embedded.revenue_center.name,
    };
    return ticket;
  }

  async addItemsToTicket(location: LocationEntity, omnivoreTicketId: string, menuItems: OmnivoreTicketItem[]) {
    if (!location || !location.omnivore_id) {
      throw new NotFoundException('Location not found');
    }

    const apiKey = location.omnivore_id === 'i8yBgkjT' ? process.env.OMNIVORE_API_KEY_DEV : process.env.OMNIVORE_API_KEY_PROD;
    const headers = {
      'Content-Type': 'application/json',
      'Api-Key': apiKey!,
    };

    if (!menuItems.length) {
      throw new BadRequestException('Missing menu items');
    }
    const body = { items: menuItems };
    const url = `${OmnivoreService.API_URL}/locations/${location.omnivore_id}/tickets/${omnivoreTicketId}/items/`;
    const res = await fetch(url, { headers, method: 'POST', body: JSON.stringify(body) });
    const json = await res.json();

    return json;
  }

  async applyDiscountsToTicket(location: LocationEntity, omnivoreTicketId: string, discounts: OmnivoreTicketDiscount[]) {
    if (!location || !location.omnivore_id) {
      throw new NotFoundException('Location not found');
    }

    const apiKey = location.omnivore_id === 'i8yBgkjT' ? process.env.OMNIVORE_API_KEY_DEV : process.env.OMNIVORE_API_KEY_PROD;
    const headers = {
      'Content-Type': 'application/json',
      'Api-Key': apiKey!,
    };

    if (!discounts.length) {
      throw new BadRequestException('Missing discounts');
    }
    const body = discounts;
    const url = `${OmnivoreService.API_URL}/locations/${location.omnivore_id}/tickets/${omnivoreTicketId}/discounts/`;
    const res = await fetch(url, { headers, method: 'POST', body: JSON.stringify(body) });
    const json = await res.json();

    return json;
  }

  async openDemoTickets(numberOfTicketsRequested: number = 25): Promise<number[]> {
    // Only allow up to 25 virtual POS tickets to be created at a time
    const numberOfTicketsToCreate = Math.min(numberOfTicketsRequested, 100);

    const virtualPosId = 'i8yBgkjT';

    const headers = {
      'Content-Type': 'application/json',
      'Api-Key': process.env.OMNIVORE_API_KEY_DEV!,
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
