import { Injectable } from '@nestjs/common';
import { Like as LikeEntity } from '../entity';
import { Story as StoryEntity } from '../entity';
import { User as UserEntity } from '../entity';
import { getRepository, FindOneOptions, getConnection } from 'typeorm';

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

        likeRepo.save(newLike);

        await getConnection()
            .createQueryBuilder()
            .update(StoryEntity)
            .set({ like_count: linkedStory[0].like_count + 1})
            .where('id = :id', { id: storyId })
            .execute();
    }

}