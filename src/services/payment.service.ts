import { Injectable, BadRequestException, } from '@nestjs/common';
import { getRepository, getConnection } from 'typeorm';
import { PaymentMethod as PaymentMethodEntity, User } from '../entity';
import { PaymentMethod as IPaymentMethod } from '../interfaces/spreedly-api';

@Injectable()
export class PaymentService {
    async readPaymentMethods(uid: string) {
        const paymentMethodRepo = await getRepository(PaymentMethodEntity);
        return await paymentMethodRepo.find({ where: { user: { uid } } });
    }

    async createPaymentMethod(uid: string, details: IPaymentMethod) {
        const user = new User();
        user.uid = uid;

        const paymentMethod = new PaymentMethodEntity();
        paymentMethod.card_type = details.card_type;
        paymentMethod.first_name = details.first_name;
        paymentMethod.last_name = details.last_name;
        paymentMethod.full_name = details.full_name;
        paymentMethod.last_four_digits = details.last_four_digits;
        paymentMethod.month = details.month;
        paymentMethod.year = details.year;
        paymentMethod.zip = details.zip;
        paymentMethod.token = details.token;
        paymentMethod.fingerprint = details.fingerprint;
        paymentMethod.user = user;

        const paymentMethodRepo = await getRepository(PaymentMethodEntity);
        try {
            const newPaymentMethod = await paymentMethodRepo.save(paymentMethod);
            return newPaymentMethod;
        } catch (e) {
            const { code } = e;
            if (code === 'ER_DUP_ENTRY') {
                throw new BadRequestException('This card already exists. Please delete the old one first.', e);
            } else {
                throw new BadRequestException('An unknown error occurred.', e);
            }
        }
    }
}
