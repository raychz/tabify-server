import { Injectable, BadRequestException, NotFoundException, } from '@nestjs/common';
import { getRepository, getConnection } from 'typeorm';
import { PaymentMethod as PaymentMethodEntity, User } from '../entity';
import { PaymentMethod as IPaymentMethod } from '../interfaces/spreedly-api';
import { SpreedlyService } from './spreedly.service';

@Injectable()
export class PaymentMethodService {
    constructor(private spreedlyService: SpreedlyService) { }

    async readPaymentMethod(uid: string, paymentMethodId: number) {
        const paymentMethodRepo = await getRepository(PaymentMethodEntity);
        return await paymentMethodRepo.findOne({ where: { user: { uid }, id: paymentMethodId } });
    }

    async readPaymentMethods(uid: string) {
        const paymentMethodRepo = await getRepository(PaymentMethodEntity);
        return await paymentMethodRepo.find({ where: { user: { uid } } });
    }

    async createPaymentMethod(uid: string, details: IPaymentMethod) {


        //If it's the users first payment method also added as the default method
        const userRepo = await getRepository(User);
        const user = await userRepo.findOne({ where: { uid }, relations: ['userSettings', 'userSettings.defaultPaymentMethod'] });
        if (!user){
            throw new NotFoundException('User not found')
         }
        
        // change above to get user from db

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

        if(! user.userSettings.defaultPaymentMethod){
         paymentMethod.userSettings = user.userSettings
        }

        const paymentMethodRepo = await getRepository(PaymentMethodEntity);
        let newPaymentMethod;
        // Save new or update existing payment method
        try {
            newPaymentMethod = await paymentMethodRepo.save(paymentMethod);
        } catch (e) {
            const { code } = e;
            // If payment method already exists, update it
            if (code === 'ER_DUP_ENTRY') {
                newPaymentMethod = await this.updatePaymentMethod(uid, paymentMethod);
            } else {
                throw new BadRequestException('An unknown error occurred while saving this payment method. Please try again.', e);
            }
        }

        if (!newPaymentMethod) {
            throw new BadRequestException('An unknown error occurred while updating this payment method. Please try again.');
        }

        // Retain payment method on Spreedly
        try {
            const retainResponse = await this.spreedlyService.retainPaymentMethod(newPaymentMethod.token);
            return newPaymentMethod;
        } catch (e) {
            throw new BadRequestException('An unknown error occurred while retaining this payment method. Please try again.', e);
        }    
    }

    async updatePaymentMethod(uid: string, newPaymentMethod: PaymentMethodEntity) {
        try {
            const paymentMethodRepo = await getRepository(PaymentMethodEntity);
            const existingPaymentMethod = await paymentMethodRepo.findOneOrFail({
                where: { user: newPaymentMethod.user, fingerprint: newPaymentMethod.fingerprint },
            });
            await paymentMethodRepo.update(existingPaymentMethod.id!, newPaymentMethod);
            const updatedPaymentMethod = await paymentMethodRepo.findOneOrFail(existingPaymentMethod.id);
            return updatedPaymentMethod;
        } catch {
            return null;
        }
    }

    async deletePaymentMethod(uid: string, method: PaymentMethodEntity) {
        const paymentMethodRepo = await getRepository(PaymentMethodEntity);
        return await paymentMethodRepo
            .createQueryBuilder()
            .delete()
            .from(PaymentMethodEntity)
            .where({ id: method.id, user: uid, fingerprint: method.fingerprint })
            .execute();
    }
}
