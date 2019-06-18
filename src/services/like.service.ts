import { Injectable } from '@nestjs/common';
import { Like as LikeEntity } from '../entity';
import { Story as StoryEntity } from '../entity';
import { User as UserEntity } from '../entity';
import { getRepository, FindOneOptions } from 'typeorm';

@Injectable()
export class LikeService {

    async createLike(storyId: number, uid: any) {
        const likeRepo = await getRepository(LikeEntity);
        const storyRepo = await getRepository(StoryEntity);
        const linkedStory = await storyRepo.find({
            where: { id: storyId },
        });

        const newLike = new LikeEntity();
        newLike.story = linkedStory[0];

        // Add current user to like
        const user = new UserEntity();
        user.uid = uid;

        newLike.user = user;

        return await likeRepo.save(newLike);
    }

}