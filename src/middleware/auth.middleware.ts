import { NestMiddleware, Injectable, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { FirebaseService } from '../services/firebase.service';
import { Request, Response } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly firService: FirebaseService) { }

  async use(req: Request & { user: any }, res: Response, next: Function) {
    if (this.skipPermittedRoutes(req, next) && next) return next();

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
        }
        req.user = {
          isAuthenticated: true,
          uid,
        };
        if (next) next();
      } catch (error) {
        throw new UnauthorizedException('Unable to authenticate using provided token.');
      }
    }
  }

  /**
   * Skip these permitted routes from middleware application.
   *
   * @param next express function to skip to the next route or middleware
   */
  skipPermittedRoutes(req: any, next: any) {
    const permitted = ['/'];

    return permitted.includes(req.originalUrl);
    /*
     * This is required here because consumer.apply().exclude
     * does not exclude wildcard matches at this time.
     * .exclude('/') // does not work
     * .forRoutes('*')
     */
  }
}
