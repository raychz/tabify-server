import { Injectable } from '@nestjs/common';
import { Like as LikeEntity } from '../entity';
import { Story as StoryEntity } from '../entity';
import { User as UserEntity } from '../entity';
import { getRepository, FindOneOptions, getConnection, EntityManager } from 'typeorm';
import { throwError } from 'rxjs';
import { StoryService } from './story.service';

@Injectable()
export class LikeService {

    constructor(private storyService: StoryService) { }

    async handleLike(storyId: number, uid: any) {
        // get a connection and create a new query runner
        const connection = getConnection();
        const queryRunner = connection.createQueryRunner();

        // establish real database connection using our new query runner
        await queryRunner.connect();

        // open a new transaction:
        await queryRunner.startTransaction();

        const likeExists = await this.checkIfLikeExists(storyId, uid, queryRunner.manager);

        try {
            if (likeExists) {
                await this.deleteLike(storyId, uid, queryRunner.manager);
            } else {
                await this.createLike(storyId, uid, queryRunner.manager);
            }

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

    async createLike(storyId: number, uid: any, manager: EntityManager) {
        const linkedStory = await this.storyService.readStory(storyId, manager);

        // If like does not exists, create new like and increment story's like_count
        const newLike = new LikeEntity();
        newLike.story = linkedStory;

        // Add current user to like
        const user = new UserEntity();
        user.uid = uid;
        newLike.user = user;

        // save new like
        await manager.save(newLike);

        // increment like count on story
        const incrementLikeOutput = await manager
            .createQueryBuilder()
            .update(StoryEntity)
            .set({ like_count: linkedStory.like_count + 1 })
            .where({ id: storyId })
            .execute();

        if (incrementLikeOutput.raw.affectedRows === 0) {
            throw 'ID does not exist.'
        }
    }

    async deleteLike(storyId: number, uid: any, manager: EntityManager) {
        const linkedStory = await this.storyService.readStory(storyId);

        // delete like on story
        const deleteLikeOutput = await manager
            .createQueryBuilder()
            .delete()
            .from(LikeEntity)
            .where({ user: uid, story: storyId })
            // .where('userUid = :user AND storyId = :story', { user: uid, story: storyId })
            .execute();

        // decrement like count on story
        const decrementLikeOutput = await manager
            .createQueryBuilder()
            .update(StoryEntity)
            .set({ like_count: linkedStory.like_count - 1 })
            .where({ id: storyId })
            .execute();

        if (decrementLikeOutput.raw.affectedRows === 0 || deleteLikeOutput.raw.affectedRows === 0) {
            throw 'ID does not exist.'
        }
    }

    // check if like on a story exists by a particular user
    async checkIfLikeExists(storyId: number, uid: any, manager: EntityManager): Promise<boolean> {
        const result = await manager.findOne(LikeEntity, {
            where: { user: uid, story: storyId }
        });

        return !!result;
    }
}