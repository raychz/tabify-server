import { Injectable } from '@nestjs/common';
import * as io from 'socket.io';
import { httpServer } from '../../main';

@Injectable()
export class IoServer {
  private static instance: IoServer;
  public socketIo: SocketIO.Server;

  constructor() {
    this.socketIo = io(httpServer);
  }

  public static getInstance() {
    if (!IoServer.instance) {
      IoServer.instance = new IoServer();
    }
    return IoServer.instance;
  }
}