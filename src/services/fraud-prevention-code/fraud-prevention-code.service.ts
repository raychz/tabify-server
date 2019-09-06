import { Injectable, Logger } from '@nestjs/common';
import { getManager, getRepository, EntityManager, getConnection } from 'typeorm';
import {
  FraudPreventionCode as FraudPreventionCodeEntity,
  User as UserEntity,
} from '@tabify/entities';
import { FirebaseService } from '@tabify/services';
import badWords from './bad-words';

@Injectable()
export class FraudPreventionCodeService {
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
    const fraudPreventionCode = new FraudPreventionCodeEntity();
    fraudPreventionCode.code = code;
    fraudPreventionCode.user = user;

    const fraudPreventionCodeRepo = await getRepository(FraudPreventionCodeEntity);
    return await fraudPreventionCodeRepo.save(fraudPreventionCode);
  }

  async addTicketNumberToCode(ticketId: number, codeId: number) {
    return await getConnection()
      .createQueryBuilder()
      .relation(FraudPreventionCodeEntity, 'ticket')
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
