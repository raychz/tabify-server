import { Injectable } from '@nestjs/common';
import { Like as LikeEntity } from '../entity';
import { Story as StoryEntity } from '../entity';
import { User as UserEntity } from '../entity';
import { getConnection, EntityManager } from 'typeorm';
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

        let res = {};

        const likeExists = await this.checkIfLikeExists(storyId, uid, queryRunner.manager);

        try {
            if (likeExists) {
                res = await this.deleteLike(storyId, uid, queryRunner.manager);
            } else {
                res = await this.createLike(storyId, uid, queryRunner.manager);
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

        // res.likeCreated = True means like created. False means like deleted
        return res;
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

        let res: any;

        // save new like
        res = await manager.save(newLike);

        res.likeCreated = true;
        return res;
    }

    async deleteLike(storyId: number, uid: any, manager: EntityManager) {
        const linkedStory = await this.storyService.readStory(storyId);

        let res: any;

        // delete like on story
        res = await manager
            .createQueryBuilder()
            .delete()
            .from(LikeEntity)
            .where({ user: uid, story: storyId })
            .execute();

        res.likeCreated = false;
        return res;
    }

    // check if like on a story exists by a particular user
    async checkIfLikeExists(storyId: number, uid: any, manager: EntityManager): Promise<boolean> {
        const result = await manager.findOne(LikeEntity, {
            where: { user: uid, story: storyId },
        });

        return !!result;
    }
}