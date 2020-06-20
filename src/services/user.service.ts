import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepository } from 'typeorm';
import { Server as ServerEntity, User as UserEntity, UserDetail as UserDetailEntity, UserSetting as UserSettingEntity } from '@tabify/entities';
import { PaymentMethodService } from '@tabify/services';

// This service handles operations for the User and UserDetails entities
@Injectable()
export class UserService
{
    constructor(
        private readonly paymentMethodService: PaymentMethodService,
    ) { }

    async createUserSetting(uid: string){
        // check if userSettings exist in DB. If not, enter user details in DB
        const userSettingRepo = await getRepository(UserSettingEntity);
        // order payment methods - select the oldest created as the default
        let userSettings = await userSettingRepo.findOne({where: {user: uid}, relations: ['user']});
        if (!userSettings){
            const newUserSetting = new UserSettingEntity();
            newUserSetting.defaultTipPercentage = 18;
            const user = new UserEntity();
            user.uid = uid;
            newUserSetting.user = user;
            const paymentMethods = await this.paymentMethodService.readPaymentMethods(uid);
            if (paymentMethods.length > 0){
                newUserSetting.defaultPaymentMethod = paymentMethods[0];
        }
            userSettings = await userSettingRepo.save(newUserSetting);
        }
        return userSettings;
    }

async createUserDetails(userDetails: any, referralCode: string) {
        // check if userDetails exist in DB. If not, enter user details in DB
        const userDetailsRepo = await getRepository(UserDetailEntity);
        const userDetailsAlreadyExist = await userDetailsRepo
            .findOne({ where: { user: userDetails.uid }, relations: ['user', 'user.userSettings'] });
        if (userDetailsAlreadyExist === undefined) {
            const refinedUserDetails = new UserDetailEntity();
            // Add current user to refinedUserDetails
            const user = new UserEntity();
            user.uid = userDetails.uid;
            refinedUserDetails.user = user;
            refinedUserDetails.email = userDetails.email;
            refinedUserDetails.displayName = userDetails.displayName;
            if (referralCode && referralCode.length !== 0) {
                const serverRepo = await getRepository(ServerEntity);

                referralCode = referralCode.trim().toUpperCase();
                const referringServer = await serverRepo.findOne({ where: { referralCode } });

                if (referringServer) {
                    refinedUserDetails.server = referringServer;
                }
            }
            if (userDetails.photo_url) {
                refinedUserDetails.photo_url = userDetails.photo_url;
            } else {
                // tslint:disable-next-line: max-line-length
                refinedUserDetails.photo_url = 'https://firebasestorage.googleapis.com/v0/b/tabify-40746.appspot.com/o/user-light.png?alt=media&token=9a1c24af-58cd-4b32-8080-361d1f6915ea';
            }
            await userDetailsRepo.save(refinedUserDetails);
            return refinedUserDetails;
        } else {
            return userDetailsAlreadyExist;
        }
    }

async getUserDetails(uid: string) {
        const userDetailsRepo = await getRepository(UserDetailEntity);
        const userDetails = await userDetailsRepo.find({ where: { user: uid }, relations: ['user', 'user.userSettings'] });
        const userDetail = userDetails[0];
        if (userDetail && !userDetail.user.userSettings) {
            userDetail.user.userSettings = await this.createUserSetting(uid);
        }
        return userDetail;
    }

async getUser(uid: string) {
        const userRepo = await getRepository(UserEntity);
        const user = await userRepo.findOneOrFail(uid, { relations: ['userDetail'] });
        return user;
    }

async updateUserSettings(id: number, userSetting: UserSettingEntity){
        const userSettingRepo = await getRepository(UserSettingEntity);
        const uSetting = await userSettingRepo.findOne(id);
        if (!uSetting){
           throw new NotFoundException('User Setting not found');
        }
        uSetting.defaultPaymentMethod = userSetting.defaultPaymentMethod;
        uSetting.defaultTipPercentage = userSetting.defaultTipPercentage;
        return await userSettingRepo.save(uSetting);
    }

async getUserSetting(uid: string) {
        const userSettingRepo = await getRepository(UserSettingEntity);
        const userSetting = await userSettingRepo.findOne({ where: { user: uid }, relations: ['user', 'defaultPaymentMethod'] });
        return userSetting;
    }

    // sets newUser of all users part of ticketId to false
async setNewUsersFalse(ticketId: number) {
        const userRepo = getRepository(UserEntity);

        // get all users associated with the ticket
        const users = await userRepo.createQueryBuilder('user')
            .innerJoin('user.tickets', 'ticketUser')
            .innerJoin('ticketUser.ticket', 'ticket')
            .where('ticket.id = :ticketId', { ticketId })
            .getMany();

        const userDetailsRepo = await getRepository(UserDetailEntity);

        // extract all uids
        const userIDs = users.map(user => {
            return user.uid;
        });

        // update their newUser status to false
        const updateNewUsers = await userDetailsRepo.createQueryBuilder()
            .update()
            .set({ newUser: false })
            .where('user.uid IN (:...userIDs)', { userIDs })
            .execute();

        return updateNewUsers;
    }
}
