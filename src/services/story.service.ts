import { Injectable } from '@nestjs/common';
import { Story as StoryEntity } from '../entity';
import { Ticket as TicketEntity } from '../entity';
import { getRepository, FindOneOptions, EntityManager, In } from 'typeorm';

@Injectable()
export class StoryService {
    // get all stories associated with the user
    async readStories(userId: any) {

        const storyRepo = await getRepository(StoryEntity);
        const storyData = await storyRepo.find({
            where: {userUid: In(['iyCovBVTj3VpkX8u5HZDtxX61cz1'])}, relations: ['ticket', 'ticket.users', 'ticket.location']});
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

    async readDetailedStory(storyId: number) {
        const storyRepo = await getRepository(StoryEntity);
        const detailedStory = await storyRepo.find({
            where: { id: storyId }, relations: ['likes', 'comments', 'ticket',
                'ticket.users', 'ticket.location'],
        });

        return detailedStory[0];
    }
}