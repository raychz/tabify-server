import { Injectable } from '@nestjs/common';
import { getRepository, EntityManager } from 'typeorm';
import { Story as StoryEntity, Ticket as TicketEntity, User as UserEntity, TicketUser } from '@tabify/entities';

@Injectable()
export class StoryService {

    async saveStory(newTicket: TicketEntity) {
        const newStory = new StoryEntity();
        newStory.ticket = newTicket;
        const storyRepo = await getRepository(StoryEntity);
        return await storyRepo.save(newStory);
    }

    /**
     * get all !!! Tickets !!! associated with the logged-in user
     * !!!!! each ticket has a story object, location, and user/user details. !!!!!
     * @param uid: string
     */
    async readStories(uid: string) {

        // starting from user Id table
        const userRepo = await getRepository(UserEntity);

        // get all tickets, and sort them by story.date_created in DESC
        const stories = await userRepo.createQueryBuilder('userEntity')
            .leftJoinAndSelect('userEntity.tickets', 'ticketUser', 'userEntity.uid = :uid', { uid })
            .leftJoinAndSelect('ticketUser.ticket', 'ticket')
            .leftJoinAndSelect('ticket.story', 'story')
            .leftJoinAndSelect('ticket.location', 'location')
            .leftJoinAndSelect('ticket.users', 'ticketUsers')
            .leftJoinAndSelect('ticketUsers.user', 'user')
            .leftJoinAndSelect('user.userDetail', 'userDetail')
            .leftJoinAndSelect('story.likes', 'likes')
            .leftJoinAndSelect('likes.user', 'userLikes')
            .orderBy({
                'story.date_created': 'DESC',
            })
            .getOne();

        // we are getting a list of ticketUsers, and in it is ticket.
        // refining the response to get rid of TicketUser object
        const refinedTickets: any[] = [];

        if (stories !== undefined) {

            for (let ticketUserIndex = 0; ticketUserIndex < stories.tickets.length; ticketUserIndex++) {
                const ticket = stories.tickets[ticketUserIndex].ticket;

                const refinedUsers = [];

                refinedTickets[ticketUserIndex] = ticket;

                for (let userIndex = 0; userIndex < refinedTickets[ticketUserIndex].users.length; userIndex++) {
                    refinedUsers.push(refinedTickets[ticketUserIndex].users[userIndex].user);
                }
                refinedTickets[ticketUserIndex].users = refinedUsers;
            }
            return refinedTickets;
        }

        return [];
    }

    async readStory(storyId: number, manager?: EntityManager) {
        let story;
        if (manager) {
            story = await manager.findOneOrFail(StoryEntity, {
                where: { id: storyId },
            });
        } else {
            const storyRepo = await getRepository(StoryEntity);
            story = await storyRepo.findOneOrFail({
                where: { id: storyId },
            });
        }
        return story;
    }

    async readDetailedStory(storyId: number) {
        const storyRepo = await getRepository(StoryEntity);
        const detailedStory: any = await storyRepo.findOneOrFail({
            where: { id: storyId },
            relations: ['ticket', 'ticket.users', 'ticket.users.user', 'ticket.users.user.userDetail',
                'ticket.location', 'likes', 'likes.user'],
        });

        const refinedUsers = [];

        if (detailedStory.ticket.users !== undefined) {
            for (let userIndex = 0; userIndex < detailedStory.ticket.users.length; userIndex++) {
                refinedUsers.push(detailedStory.ticket.users[userIndex].user);
            }
        }

        detailedStory.ticket.users = refinedUsers;

        return detailedStory;
    }

    // returns story object, with detailed list of likers
    async getStoryLikers(storyId: number) {
        const storyRepo = await getRepository(StoryEntity);
        const likers = await storyRepo.findOneOrFail({
            where: { id: storyId },
            relations: ['likes', 'likes.user', 'likes.user.userDetail'],
        });

        return likers;
    }
}