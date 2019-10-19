import { NestMiddleware, Injectable, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { FirebaseService } from '../services/firebase.service';
import { MiddlewareFunction } from '@nestjs/common/interfaces';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly firService: FirebaseService) { }

  resolve(): MiddlewareFunction {
    return async (req, res, next) => {
      // token id should be placed in the request headers
      if (!req.headers || !req.headers.authorization) {
        req.user = { isAuthenticated: false, uid: null };
        throw new UnauthorizedException('Unable to authenticate using provided token.');
      } else {
        try {
          const uid = await this.firService.getUidFromToken(
            req.headers.authorization,
          );

          if (!uid) {
            throw new UnauthorizedException('Unable to authenticate using provided token.');
          } else {
            req.user = {
              isAuthenticated: true,
              uid,
            };
            if (next) {
              next();
            }
          }
        } catch (error) {
          throw new UnauthorizedException('Unable to authenticate using provided token.');
        }
      }
    };
  }
}
