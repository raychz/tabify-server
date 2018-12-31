import { Get, Controller, Param, Res, Post, Body, HttpStatus } from '@nestjs/common';
import { FirebaseService } from 'services/firebase.service';
import { auth } from 'firebase-admin';
import { Response as ServerResponse } from 'express-serve-static-core';
import { getManager, getRepository } from 'typeorm';
import { User as UserEntity } from 'entity';

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

  /**
   * Adds a user uid to the database if does not exist.
   */
  @Post()
  async saveUser(@Res() res: ServerResponse, @Body() body: any) {
    const { uid } = body;
    if (!uid) {
      res.status(400);
      res.send({
        message: 'Missing User Id',
      });
      return;
    }
    const user = await this.firService.getUserInfo(uid).catch(() => res.status(400));
    if (!user) {
      res.send({
        message: 'User does not exist on FIR',
      });
      return;
    }

    const userRepo = await getRepository(UserEntity);
    await userRepo.save({ uid });
    res.send(user);
  }
}
