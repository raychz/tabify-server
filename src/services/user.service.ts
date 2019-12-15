import { Injectable } from '@nestjs/common';
import { getRepository } from 'typeorm';
import {
    Server as ServerEntity, User as UserEntity, UserDetail as UserDetailEntity, Ticket as TicketEntity
} from '@tabify/entities';

// This service handles operations for the User and UserDetails entities
@Injectable()
export class UserService {

    async createUserDetails(userDetails: any, referralCode: string) {

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
        const userDetail = await userDetailsRepo.find({ where: { user: uid }, relations: ['user'] });
        return userDetail[0];
    }

    /**
     * sets newUser of all users part of ticketId to false
     * @param ticketId ticketId
     */
    async setNewUsersFalse(ticketId: number) {
        const userRepo = getRepository(UserEntity);

        // get all users associated with the ticket
        const users = await userRepo.createQueryBuilder('user')
            .innerJoin('user.tickets', 'ticket')
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
