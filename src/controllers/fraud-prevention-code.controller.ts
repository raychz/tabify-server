import { Get, Controller, Query, Res, Post, Body, HttpException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { FraudPreventionCodeService } from '@tabify/services';
import { User } from '../decorators/user.decorator';

@Controller('fraud-prevention-code')
export class FraudPreventionCodeController {
  constructor(
    private readonly fraudPreventionCodeService: FraudPreventionCodeService,
  ) { }

  @Get()
  async getFraudPreventionCode(@User('uid') uid: string) {
    const result = await this.fraudPreventionCodeService.getFraudPreventionCode(uid);
    if (!result) {
      throw new InternalServerErrorException('There was an error getting the fraud prevention code');
    }
    return result;
  }
}
