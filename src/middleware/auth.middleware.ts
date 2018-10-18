import { NestMiddleware, Injectable, HttpStatus } from '@nestjs/common';
import { FirebaseService } from '../services/firebase-service';
import { RequestHandler } from '@nestjs/common/interfaces';
import { Response } from 'express-serve-static-core';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly firService: FirebaseService) {}

  resolve(): RequestHandler {
    return async (req, res, next) => {
      // token id should be placed in the request headers
      if (!req.headers || !req.headers.authorization) {
        res.locals.auth = { isAuthenticated: false, uid: null };
        this.responseMessage(res, 401, 'Missing auth token');
      } else {
        try {
          const uid = await this.firService.getUidFromToken(
            req.headers.authorization,
          );

          if (!uid) {
            this.responseMessage(res, 401, 'Unable to authentica using provided token');
          } else {
            res.locals.auth = {
              isAuthenticated: true,
              uid,
            };
            if (next) {
              next();
            }
          }
        } catch (error) {
          this.responseMessage(res, 401, 'Unable to authentica using provided token');
        }
      }
    };
  }

  responseMessage(res: Response, statusCode: HttpStatus,  message: string) {
    res
      .status(401)
      .send({ message });
  }
}
