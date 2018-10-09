import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';

@Injectable()
export class OmnivoreService { 
  static readonly API_URL = 'https://api.omnivore.io/1.0'
  getLocations () {
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
    return await fetch(url, { headers }).json();
  }
}