import { Injectable } from '@nestjs/common';
import { UserDetail as UserDetailEntity } from '../entity';
import { getRepository } from 'typeorm';
import { User as UserEntity } from '../entity';
import { Server as ServerEntity } from '../entity';

// This service handles operations for the User and UserDetails entities
@Injectable()
export class UserService {

    async createUserDetails(userDetails: any, referralCode: any) {

        // check if userDetails exist in DB. If not, enter user details in DB
        const userDetailsRepo = await getRepository(UserDetailEntity);
        const userDetailsAlreadyExist = await userDetailsRepo
            .findOne({ where: { user: userDetails.uid }, relations: ['user'] });

        if (userDetailsAlreadyExist === undefined) {
            const refinedUserDetails = new UserDetailEntity();

            // Add current user to refinedUserDetails
            const user = new UserEntity();
            user.uid = userDetails.uid;
            refinedUserDetails.user = user;

            refinedUserDetails.email = userDetails.email;
            refinedUserDetails.displayName = userDetails.displayName;

            if (referralCode.referralCode && referralCode.referralCode.length !== 0) {
                const serverRepo = await getRepository(ServerEntity);
                const referringServer = await serverRepo.findOne({ where: { referralCode: referralCode.referralCode } });

                if (referringServer !== undefined) {
                    refinedUserDetails.server = referringServer;
                }
            }

            if (userDetails.photo_url !== undefined) {
                refinedUserDetails.photo_url = userDetails.photo_url;
            } else {
                refinedUserDetails.photo_url = 'https://cdn.business2community.com/wp-content/uploads/2017/08/blank-profile-picture-973460_640.png'
            }

            await userDetailsRepo.save(refinedUserDetails);
            return refinedUserDetails;
        } else {
            return userDetailsAlreadyExist;
        }
    }

    async getUserDetails(uid: string) {
        const userDetailsRepo = await getRepository(UserDetailEntity);
        const userDetail = await userDetailsRepo.find({ where: { user: uid }, relations: ['user']});
        return userDetail[0];
    }
}
