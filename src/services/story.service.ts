import { Injectable } from '@nestjs/common';
import { Story as StoryEntity } from '../entity';
import { getRepository, EntityManager } from 'typeorm';
import { Ticket as TicketEntity } from '../entity';
import { User as UserEntity } from '../entity';

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
     * @param userId: string
     */
    async readStories(userId: string) {

        // starting from user Id table
        const userRepo = await getRepository(UserEntity);

        // get all tickets, and sort them by story.date_created in DESC
        const stories = await userRepo.createQueryBuilder('user')
            .leftJoinAndSelect('user.tickets', 'ticket', 'user.uid = :userId', { userId })
            .leftJoinAndSelect('ticket.story', 'story')
            .leftJoinAndSelect('ticket.location', 'location')
            .leftJoinAndSelect('story.likes', 'likes')
            .leftJoinAndSelect('likes.user', 'userLikes')
            .orderBy({
                'story.date_created': 'DESC',
            })
            .getOne();

        return stories;
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
        const detailedStory = await storyRepo.findOneOrFail({
            where: { id: storyId },
            relations: ['ticket', 'ticket.users', 'ticket.location', 'likes', 'likes.user'],
        });

        return detailedStory;
    }
}