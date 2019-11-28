import { Injectable, Logger } from '@nestjs/common';
import * as AblyPromises from 'ably/promises';

@Injectable()
export class AblyService {
  private realtime: AblyPromises.Realtime;

  constructor() {
    this.realtime = new AblyPromises.Realtime.Promise({ key: process.env.ABLY_KEY });
    this.realtime.connection.on((stateChange) => {
      Logger.log('New Ably connection state is ' + stateChange.current);
    });
    this.realtime.connection.on('failed', this.onFailure.bind(this));
  }

  async publish(messageName: string, messageData: any, channel: string) {
    const ablyChannel = this.realtime.channels.get(channel);
    await ablyChannel.publish(messageName, messageData);
  }

  private onFailure() {
    Logger.error('The Ably connection has failed.');
    throw new Error('The Ably connection has failed.');
  }
}