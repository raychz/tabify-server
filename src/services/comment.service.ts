import { Injectable } from '@nestjs/common';
import { Comment as CommentEntity } from '../entity';
import { Story as StoryEntity } from '../entity';
import { User as UserEntity } from '../entity';
import { getRepository, FindOneOptions, getConnection, EntityManager } from 'typeorm';

@Injectable()
export class CommentService {
    // create a comment
    async createComment(storyId: number, uid: any, commentText: string) {
        const storyRepo = await getRepository(StoryEntity);
        const linkedStory = await storyRepo.find({
            where: { id: storyId },
        });

        const newComment = new CommentEntity();
        newComment.text = commentText;
        newComment.story = linkedStory[0];

        // Add current user to comment
        const user = new UserEntity();
        user.uid = uid;
        newComment.user = user;

        // get a connection and create a new query runner
        const connection = getConnection();
        const queryRunner = connection.createQueryRunner();

        // establish real database connection using our new query runner
        await queryRunner.connect();

        // open a new transaction:
        await queryRunner.startTransaction();

        try {

            // save new comment
            await queryRunner.manager.save(newComment);

            // increment comment count on story
            await queryRunner.manager
                .createQueryBuilder()
                .update(StoryEntity)
                .set({ comment_count: linkedStory[0].comment_count + 1 })
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

    // delete comment
    async deleteComment(storyId: number, uid: any) {
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

        try {
            // delete comment on story
            await queryRunner.manager
                .createQueryBuilder()
                .delete()
                .from(CommentEntity)
                .where('userUid = :user AND storyId = :story', { user: uid, story: storyId })
                .execute();

            // decrement comment count on story
            await queryRunner.manager
                .createQueryBuilder()
                .update(StoryEntity)
                .set({ comment_count: linkedStory[0].comment_count - 1 })
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