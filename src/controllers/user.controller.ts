import { Get, Controller, Param, Res } from '@nestjs/common';
import { FirebaseService } from 'services/firebase-service';
import { auth } from 'firebase-admin';
import { Response as ServerResponse } from 'express-serve-static-core';

@Controller('user')
export class UserController {
  constructor(private readonly firService: FirebaseService) {}

  /**
   * Returns the user info based on authenticated user, uid
   * should be passed from auth middleware
   */
  @Get()
  async getUserInfo(@Res() res: ServerResponse) {
    const { uid } = res.locals.auth;
    res.send(this.firService.getUserInfo(uid)); // HMrwQHUTTTasdYSscKNwee6PmS63
  }

  @Get(':uid')
  async getUserById(@Param('uid') uid: string): Promise<auth.UserRecord> {
    return this.firService.getUserInfo(uid);
  }
}
