import { Get, Controller, Post, Headers, Body, InternalServerErrorException, Param, Patch } from '@nestjs/common';
import { getRepository } from 'typeorm';
<<<<<<< HEAD
import { User as UserEntity, UserSetting } from '@tabify/entities';
import { FirebaseService, UserService } from '@tabify/services';
=======
import { User as UserEntity } from '@tabify/entities';
import { FirebaseService, UserService, CouponService } from '@tabify/services';
>>>>>>> master
import { User } from '../decorators/user.decorator';
import { Coupon, CouponOffOf, CouponType } from '../entity/coupon.entity';

@Controller('user')
export class UserController {
  constructor(
    private readonly firService: FirebaseService,
    private readonly userService: UserService,
    private readonly couponService: CouponService,
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
     // save user settings
     const savedUserSettings = await this.userService.createUserSetting(uid);
    // save user details
    const savedUserDetails = await this.userService.createUserDetails(user, referralCode);
<<<<<<< HEAD
=======

    // assign new user coupon ($5 off at Piccola's) and all other valid coupons
    // const newUserCouponEndDate = new Date();
    // newUserCouponEndDate.setDate(newUserCouponEndDate.getDate() + 30);
    // const coupon: Coupon = {
    //   description: 'New User Coupon - $5 off your total bill at Piccola Italia Ristorante',
    //   value: 500,
    //   estimated_dollar_value: 500,
    //   usage_limit: 1,
    //   coupon_off_of: CouponOffOf.TICKET,
    //   coupon_type: CouponType.DOLLAR_VALUE,
    //   coupon_start_date: new Date(),
    //   coupon_end_date: newUserCouponEndDate,
    //   applies_to_everyone: false,
    // };
    // const piccolaLocationOmnivoreId = 'cx9pap8i';
    // this.couponService.saveNewCoupon(coupon, piccolaLocationOmnivoreId, [uid]);
    this.couponService.assignUsersValidCoupons([uid]);

>>>>>>> master
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
    @Body() userSetting: UserSetting,
  ) {
      const updatedUserSettings = await this.userService.updateUserSettings(id, userSetting);
      return updatedUserSettings;
    }
}
