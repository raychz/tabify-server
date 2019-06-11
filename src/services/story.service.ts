import { Injectable } from '@nestjs/common';
// import { Story as StoryEntity } from '../entity';
import { Ticket as TicketEntity, User } from '../entity';
import { User as UserEntity } from '../entity';
import { getRepository, FindOneOptions } from 'typeorm';

@Injectable()
export class StoryService {
    // get all stories associated with the user
    async getStories(userId: any) {
        const userRepo = await getRepository(UserEntity);
        const userData = await userRepo.find({where: {uid: userId}, relations: ['tickets', 'tickets.story', 
        'tickets.story.comments', 'tickets.story.likes']});

        // Fix: need to get ALL stories, not just the first. 
        return userData[0].tickets[0].story;
    }
}