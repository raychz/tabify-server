import { Get, Controller, Query, Res, Post, Body } from '@nestjs/common';
import { FraudPreventionCodeService } from '../services/fraud-prevention-code/fraud-prevention-code.service';
import { Response as ServerResponse } from 'express-serve-static-core';

@Controller('fraud-prevention-code')
export class FraudPreventionCodeController {
  constructor(
    private readonly fraudPreventionCodeService: FraudPreventionCodeService,
  ) { }

  @Get()
  async getFraudPreventionCode(@Res() res: ServerResponse, @Query() params: any) {
    const {
      locals: {
        auth: { uid },
      },
    } = res;

    const result = await this.fraudPreventionCodeService.getFraudPreventionCode(uid);
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
