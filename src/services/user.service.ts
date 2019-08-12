import { Injectable } from '@nestjs/common';
import { UserDetail as UserDetailEntity } from '../entity';
import { getRepository } from 'typeorm';
import { User as UserEntity } from '../entity';

// This service handles operations for the User and UserDetails entities
@Injectable()
export class UserService {

    async createUserDetails(userDetails: any) {

        const refinedUserDetails: any = {};

        // Add current user to refinedUserDetails
        const user = new UserEntity();
        user.uid = userDetails.uid;
        refinedUserDetails.user = user;

        refinedUserDetails.email = userDetails.email;
        refinedUserDetails.displayName = userDetails.displayName;

        if (userDetails.photoURL !== undefined) {
            refinedUserDetails.photoURL = userDetails.photoURL;
        }

        const userDetailsRepo = await getRepository(UserDetailEntity);
        userDetailsRepo.save(refinedUserDetails);
    }

    async getUserDetails(uid: string) {
        const userDetailsRepo = await getRepository(UserDetailEntity);
        const userDetail = await userDetailsRepo.find({where: { user: uid }});
        return userDetail[0];
    }
}
