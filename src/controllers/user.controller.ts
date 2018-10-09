import { Get, Controller, Param, Response } from '@nestjs/common';
import { FirebaseService } from 'services/firebase-service';
import { auth } from 'firebase-admin';

@Controller('user')
export class UserController {
  constructor(private readonly firService: FirebaseService) {}

  /**
   * Returns the user info based on authenticated user, uid
   * should be passed from auth middleware
   */
  @Get()
  async getUserInfo(@Response() res): Promise<auth.UserRecord> {
    if (res.locals.auth && res.locals.auth.uid) {
      return await this.firService.getUserInfo('HMrwQHUTTTasdYSscKNwee6PmS63');
    }
  }

  @Get(':uid')
  async getUserById(@Param('uid') uid: string): Promise<auth.UserRecord> {
    return await this.firService.getUserInfo(uid);
  }
}
