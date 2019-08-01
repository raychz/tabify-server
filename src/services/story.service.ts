import { Injectable } from '@nestjs/common';
import { Story as StoryEntity, User } from '../entity';
import { getRepository, EntityManager, createQueryBuilder, Connection, getConnection, getConnectionManager } from 'typeorm';
import { Ticket as TicketEntity } from '../entity';
import { User as UserEntity } from '../entity';
import { relative } from 'path';

@Injectable()
export class StoryService {
    // get all stories associated with the logged-in user
    async readStories(userId: any) {

        let stories: any = [];

        const userRepo = await getRepository(UserEntity);
        stories = await userRepo.find(
            {
                where: { uid: userId },
                relations: ['tickets', 'tickets.story', 'tickets.location',
                    'tickets.users', 'tickets.users.userDetail'],
            });

        return stories[0];
    }

    // async createStory(ticket: TicketEntity) {

    //     const storyRepo = await getRepository(StoryEntity);
    //     const newStory = new StoryEntity();
    // }

    async deleteStory(storyId: number) {
    }

    async updateStory(storyId: number) {
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
        const detailedStory = await storyRepo.find({
            where: { id: storyId }, relations: ['likes', 'comments', 'ticket',
                'ticket.users', 'ticket.location'],
        });

        return detailedStory[0];
    }
}