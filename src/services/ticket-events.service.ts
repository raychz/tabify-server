import { Injectable } from '@nestjs/common';
import { IoServer } from 'modules/socket/socket-server';
import { Socket } from 'socket.io';
import { FirebaseService } from './firebase.service';

@Injectable()
export class TicketEventsService {
  constructor(private readonly io: IoServer, private firService: FirebaseService) {
    const ticketNsps = this.io.socketIo.of('/ticket-events');
    ticketNsps.on('connection', this.onConnetion.bind(this));

  }

  private onConnetion(socket: Socket) {
    const uid = socket.handshake.query.uid;
    socket.on('JOIN_TICKET_ROOM', async (room) => {
      socket.handshake.query.room = room;
      socket.join(room);
      const user = await this.firService.getUserInfo(uid);
      socket.broadcast.to(room).emit(room, `User ${user.email} has JOINED the room`);
    });

    socket.on('disconnect', async () => {
      const user = await this.firService.getUserInfo(uid);
      const { room } = socket.handshake.query;
      socket.broadcast.to(room).emit(room, `User ${user.email} has LEFT the room`);
      socket.leaveAll();
    });
  }

}