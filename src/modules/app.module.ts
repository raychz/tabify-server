import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import * as firAdmin from 'firebase-admin';
import firAdminConfig from '../globals/firebase';

/**
 * Middleware
 */
import { MorganMiddleware } from '@nest-middlewares/morgan';
import { AuthMiddleware } from '../middleware/auth.middleware';

/**
 * Controllers
 */
import * as Controllers from '../controllers';

/**
 * Services
 */
import { PaymentService } from '../services/payment.service';
import { FirebaseService } from '../services/firebase.service';
import { OmnivoreService } from '../services/omnivore.service';
import { SpreedlyService } from '../services/spreedly.service';
import { TicketService } from '../services/ticket-service';
import { SocketServer } from './socket/socket.module';
import { TicketEventsService } from '../services/ticket-events.service';
import { LocationService } from '../services/location.service';
import { FraudPreventionCodeService } from '../services/fraud-prevention-code/fraud-prevention-code.service';

const controllers = Object.values(Controllers);

// Initializing the FIRAdmin app probably should be somewhere else
firAdmin.initializeApp(firAdminConfig);

@Module({
  imports: [SocketServer],
  controllers,
  providers: [
    PaymentService,
    FirebaseService,
    OmnivoreService,
    SpreedlyService,
    TicketService,
    TicketEventsService,
    LocationService,
    FraudPreventionCodeService,
  ],
})
export class AppModule implements NestModule {
  constructor() {}

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
    MorganMiddleware.configure('tiny');
    consumer.apply(MorganMiddleware).forRoutes('*');
  }
}
