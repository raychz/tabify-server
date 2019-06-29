import { Injectable } from '@nestjs/common';
import { Like as LikeEntity } from '../entity';
import { Story as StoryEntity } from '../entity';
import { User as UserEntity } from '../entity';
import { getRepository, FindOneOptions, getConnection, EntityManager } from 'typeorm';

@Injectable()
export class LikeService {

    async createLike(storyId: number, uid: any) {
        const likeExists = await this.checkIfLikeExists(storyId, uid);
        const likeRepo = await getRepository(LikeEntity);
        const storyRepo = await getRepository(StoryEntity);
        const linkedStory = await storyRepo.find({
            where: { id: storyId },
        });

        // get a connection and create a new query runner
        const connection = getConnection();
        const queryRunner = connection.createQueryRunner();

        // establish real database connection using our new query runner
        await queryRunner.connect();

        // open a new transaction:
        await queryRunner.startTransaction();

        // If like does not exists, create new like and increment story's like_count
        if (!likeExists) {
            const newLike = new LikeEntity();
            newLike.story = linkedStory[0];

            // Add current user to like
            const user = new UserEntity();
            user.uid = uid;

            newLike.user = user;

            try {

                // save new like
                await queryRunner.manager.save(newLike);

                // increment like count on story
                await queryRunner.manager
                    .createQueryBuilder()
                    .update(StoryEntity)
                    .set({ like_count: linkedStory[0].like_count + 1 })
                    .where('id = :id', { id: storyId })
                    .execute();

                // commit transaction
                await queryRunner.commitTransaction();

            } catch (err) {

                // since we have errors lets rollback changes made
                await queryRunner.rollbackTransaction();

            } finally {

                // release query runner which is manually created
                await queryRunner.release();
            }

        // else delete the like in like table, and decrement story's like_count
        } else {

            try {

                // delete like on story
                await queryRunner.manager
                    .createQueryBuilder()
                    .delete()
                    .from(LikeEntity)
                    .where('userUid = :user AND storyId = :story', { user: uid, story: storyId })
                    .execute();

                // decrement like count on story
                await queryRunner.manager
                    .createQueryBuilder()
                    .update(StoryEntity)
                    .set({ like_count: linkedStory[0].like_count - 1 })
                    .where('id = :id', { id: storyId })
                    .execute();

                // commit transaction
                await queryRunner.commitTransaction();

            } catch (err) {

                // since we have errors lets rollback changes made
                await queryRunner.rollbackTransaction();

            } finally {

                // release query runner which is manually created
                await queryRunner.release();
            }
        }
    }

    // check if like on a story exists by a particular user
    async checkIfLikeExists(storyId: number, uid: any): Promise<boolean> {
        const result = await getConnection()
            .getRepository(LikeEntity)
            .createQueryBuilder()
            .where('userUid = :user AND storyId = :story', { user: uid, story: storyId })
            .getOne();
        return result !== undefined;
    }

}