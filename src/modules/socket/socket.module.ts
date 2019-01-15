import { Module } from '@nestjs/common';
import { IoServer } from './socket-server';

@Module({
  providers: [
    IoServer, {
      /**
       * Guarantess theres only one instance when injected into another class
       */
      provide: 'IoServer',
      useFactory: () => IoServer.getInstance(),
    },
  ],
  exports: [IoServer],
})
export class SocketServer {}