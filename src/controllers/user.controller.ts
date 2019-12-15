import { Get, Controller, Res, Post, Headers, Body, InternalServerErrorException } from '@nestjs/common';
import { getRepository } from 'typeorm';
import { User as UserEntity } from '@tabify/entities';
import { FirebaseService, UserService } from '@tabify/services';
import { User } from '../decorators/user.decorator';

@Controller('user')
export class UserController {
  constructor(
    private readonly firService: FirebaseService,
    private readonly userService: UserService,
  ) { }

  /**
   * Returns the user info based on authenticated user, uid
   * should be passed from auth middleware
   */
  @Get()
  async getUserInfo(
    @User('uid') uid: string,
  ) {
    return this.firService.getUserInfo(uid);
  }

  /**
   * Adds a user uid to the database if does not exist.
   */
  @Post()
  async saveUser(
    @User('uid') uid: string,
    @Headers('authorization') authorization: string,
    @Body('referralCode') referralCode: string,
  ) {
    const user = await this.firService
      .getUserInfo(uid);

    if (!user) {
      throw new InternalServerErrorException('This user does not exist in Firebase.');
    }

    const userRepo = await getRepository(UserEntity);
    await userRepo.save({ uid });

    // save user details
    const savedUserDetails = await this.userService.createUserDetails(user, referralCode);

    return savedUserDetails;
  }

  /**
   * Returns userDetails from DB, if they exist
   */
  @Get('/userDetails')
  async getUserDetailsFromDB(@User('uid') uid: string) {
    const userDetails = await this.userService.getUserDetails(uid);
    return userDetails;
  }
}
