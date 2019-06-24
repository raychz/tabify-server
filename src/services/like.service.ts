import { Injectable } from '@nestjs/common';
import { Like as LikeEntity } from '../entity';
import { Story as StoryEntity } from '../entity';
import { User as UserEntity } from '../entity';
import { getRepository, FindOneOptions, getConnection } from 'typeorm';

@Injectable()
export class LikeService {

    async createLike(storyId: number, uid: any) {
        const likeExists = await this.checkIfLikeExists(storyId, uid);
        const likeRepo = await getRepository(LikeEntity);
        const storyRepo = await getRepository(StoryEntity);
        const linkedStory = await storyRepo.find({
            where: { id: storyId },
        });

        // If like does not exists, create new like and increment story's like_count
        if (!likeExists) {
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

        // else delete the like in like table, and decrement story's like_count
        } else {

            await getConnection()
                .createQueryBuilder()
                .delete()
                .from(LikeEntity)
                .where('userUid = :user AND storyId = :story', { user: uid, story: storyId})
                .execute();

            await getConnection()
                .createQueryBuilder()
                .update(StoryEntity)
                .set({ like_count: linkedStory[0].like_count - 1})
                .where('id = :id', { id: storyId })
                .execute();
        }
    }

    // check if like on a story exists by a particular user
    async checkIfLikeExists(storyId: number, uid: any): Promise<boolean> {
        const result = await getConnection()
            .getRepository(LikeEntity)
            .createQueryBuilder()
            .where('userUid = :user AND storyId = :story', { user: uid, story: storyId})
            .getOne();
        return result !== undefined;
    }

}