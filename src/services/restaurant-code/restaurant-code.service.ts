import { Injectable, Logger } from '@nestjs/common';
import {
  RestaurantCode as RestaurantCodeEntity,
  User as UserEntity,
} from '../../entity';
import { getManager, getRepository, EntityManager, getConnection } from 'typeorm';
import { FirebaseService } from '../firebase.service';
import badWords from './bad-words';

@Injectable()
export class RestaurantCodeService {
  private fraudPreventionCodeLength = 3;
  private allowedCodeLetterOptions = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

  constructor(
    private readonly firebaseService: FirebaseService,
  ) { }

  /**
   * Generates 3 digit alphanumeric code without 0s, Os, 1s, or Is used for fraud prevention
   * Saves to DB
   */
  async getFraudPreventionCode(uid: string) {
    const code = this.generateCode();
    const user = new UserEntity();
    user.uid = uid;
    const restaurantCode = new RestaurantCodeEntity();
    restaurantCode.code = code;
    restaurantCode.user = user;

    const restaurantCodeRepo = await getRepository(RestaurantCodeEntity);
    return await restaurantCodeRepo.save(restaurantCode);
  }

  async addTicketNumberToCode(ticketId: number, codeId: number) {
    return await getConnection()
      .createQueryBuilder()
      .relation(RestaurantCodeEntity, 'ticket')
      .of(codeId)
      .set(ticketId);
  }

  generateCode() {
    let result;
    do {
      result = '';
      const length = this.fraudPreventionCodeLength;
      const chars = this.allowedCodeLetterOptions;
      for (let i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    } while (badWords.includes(result));

    return result;
  }
}
