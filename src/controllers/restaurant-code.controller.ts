import { Get, Controller, Query, Res, Post, Body } from '@nestjs/common';
import { RestaurantCodeService } from '../services/restaurant-code/restaurant-code.service';
import { Response as ServerResponse } from 'express-serve-static-core';

@Controller('restaurant-code')
export class RestaurantCodeController {
  constructor(
    private readonly restaurantCodeService: RestaurantCodeService,
  ) { }

  @Get()
  async getFraudPreventionCode(@Res() res: ServerResponse, @Query() params: any) {
    const {
      locals: {
        auth: { uid },
      },
    } = res;

    const result = await this.restaurantCodeService.getFraudPreventionCode(uid);
    if (!result) {
      res.status(500);
      res.send({
        message: 'There was an error getting the fraud prevention code',
      });
      return;
    }

    res.send(result);
  }
}
