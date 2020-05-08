import { Get, Controller, Res, Post, Headers, Body, InternalServerErrorException, Param, Patch } from '@nestjs/common';
import { getRepository } from 'typeorm';
import { User as UserEntity, UserSetting } from '@tabify/entities';
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
    console.log("it works 43");
     // save user settings
     const savedUserSettings = await this.userService.createUserSetting(uid);
     console.log("it works 46");
    // save user details
    const savedUserDetails = await this.userService.createUserDetails(user, referralCode);
    console.log("it works 49");
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

  // get user settings endpoint
  @Get('/userSettings/')
  async getUserSettingsFromDB(@User('uid') uid: string){
    const userSettings = await this.userService.getUserSetting(uid);
    return userSettings;
  }
  
  /**
   * User Settings update USE - Patch insted of Post
   */
  @Patch('/userSettings/:id')
  async updateUserSettings( 
    @Param('id') id: number,
    @Body() userSetting: UserSetting
  ) {
      const updatedUserSettings = await this.userService.updateUserSettings(id, userSetting);
      return updatedUserSettings;
    }
}
