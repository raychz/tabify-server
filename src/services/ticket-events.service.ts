import { Injectable } from '@nestjs/common';
import { IoServer } from 'modules/socket/socket-server';
import { Socket } from 'socket.io';
import { FirebaseService } from './firebase.service';

export enum TICKET_SOCKET_EVENTS {
  /**
   * Message received from the client when
   * a user wants to join the ticket
   */
  JOIN_TICKET_ROOM = 'JOIN_TICKET_ROOM',
  USER_JOINED = 'USER_JOINED',
  USER_LEFT = 'USER_LEFT',
  USER_READY = 'USER_READY',
  USER_NOT_READY = 'USER_NOT_READY',
  ADD_ITEM_TO_USER_TAB = 'ADD_ITEM_TO_USER_TAB',
  REMOVE_ITEM_FROM_USER_TAB = 'REMOVE_ITEM_FROM_USER_TAB',
  /**
   * @description Message sent from the server when all users have finished selecting an item.
   */
  FINISHED_TAB_SELECTIONS = 'FINISHED_TAB_SELECTIONS',
}

@Injectable()
export class TicketEventsService {
  constructor(private readonly io: IoServer, private firService: FirebaseService) {
    const ticketNsps = this.io.socketIo.of('/ticket-events');
    ticketNsps.on('connection', this.onConnetion.bind(this));

  }

  private onConnetion(socket: Socket) {
    const uid = socket.handshake.query.uid;
    socket.on(TICKET_SOCKET_EVENTS.JOIN_TICKET_ROOM, async (room) => {
      socket.handshake.query.room = room;
      socket.join(room);
      const user = await this.firService.getUserInfo(uid);
      socket.broadcast.to(room).emit(TICKET_SOCKET_EVENTS.USER_JOINED, user);
    });

    socket.on('disconnect', async () => {
      const user = await this.firService.getUserInfo(uid);
      const { room } = socket.handshake.query;

      // TODO: Remove current user from the ticket and all ticket items in the db.
      socket.broadcast.to(room).emit(TICKET_SOCKET_EVENTS.USER_LEFT, user);
      socket.leave(room);
    });
  }

}