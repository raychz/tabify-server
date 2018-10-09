import { NestMiddleware, MiddlewareFunction, Injectable } from '@nestjs/common';
import { FirebaseService } from '../services/firebase-service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly firService: FirebaseService) {}

  resolve(): MiddlewareFunction {
    return async (req, res, next) => {
      // token id should be placed in the request headers
      if (!req.headers || !req.headers.authorization) {
        res.locals.auth = { isAuthenticated: false, uid: null };
        this.responseMessage(401, 'Missing auth token')
      } else {
        try {
          const uid = await this.firService.getUidFromToken(
            req.headers.authorization,
          );

          if (!uid) {
            this.responseMessage(401, 'Unable to authentica using provided token')
          } else {
            res.locals.auth = {
              isAuthenticated: true,
              uid,
            };
            next();
          }
        } catch (error) {
          this.responseMessage(401, 'Unable to authentica using provided token')
        } 
      }
    };
  }

  responseMessage(res, message) {
    res
      .status(401)
      .send({ message });

  }
}
