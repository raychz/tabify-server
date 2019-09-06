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
import * as tabifyControllers from '@tabify/controllers';

/**
 * Services
 */
import * as tabifyServices from '@tabify/services';

// Initializing the FIRAdmin app probably should be somewhere else
firAdmin.initializeApp(firAdminConfig);

@Module({
  imports: [],
  controllers: Object.values(tabifyControllers),
  providers: Object.values(tabifyServices),
})
export class AppModule implements NestModule {
  constructor() { }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
    MorganMiddleware.configure('tiny');
    consumer.apply(MorganMiddleware).forRoutes('*');
  }
}
