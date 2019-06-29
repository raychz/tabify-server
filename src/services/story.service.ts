import { Injectable } from '@nestjs/common';
import { Story as StoryEntity } from '../entity';
import { Ticket as TicketEntity } from '../entity';
import { getRepository, FindOneOptions, EntityManager } from 'typeorm';

@Injectable()
export class StoryService {
    // get all stories associated with the user
    async readStories(userId: any) {

        const storyRepo = await getRepository(StoryEntity);
        const storyData = await storyRepo.find({
            where: { uid: userId }, relations: ['likes', 'comments', 'ticket',
                'ticket.users', 'ticket.location'],
        });

        // for (let i = 0; i < storyData.length; i++) {
        //     storyData[i] = storyData[i].['story'];
        // }

        return storyData;
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
}