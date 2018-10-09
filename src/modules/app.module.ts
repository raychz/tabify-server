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
import { AuthMiddleware } from '../middleware/auth.middleware';

/**
 * Controllers
 */
import * as Controllers from '../controllers';

/**
 * Services
 */
import { PaymentService } from 'services/payment.service';
import { FirebaseService } from 'services/firebase-service';
import { OmnivoreService } from 'services/omnivore-service'
import { TicketService } from 'services/ticket-service';

const controllers = Object.keys(Controllers).map(k => Controllers[k]);

// Initializing the FIRAdmin app probably should be somewhere else
firAdmin.initializeApp(firAdminConfig);

@Module({
  imports: [],
  controllers,
  providers: [PaymentService, FirebaseService, OmnivoreService, TicketService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      // .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
