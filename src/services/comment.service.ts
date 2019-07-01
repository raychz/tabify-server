import { Injectable } from '@nestjs/common';
import { Story as StoryEntity } from '../entity';
import { Comment as CommentEntity } from '../entity';
import { User as UserEntity } from '../entity';
import { getConnection, EntityManager } from 'typeorm';
import { StoryService } from './story.service';

@Injectable()
export class CommentService {

    constructor(private storyService: StoryService) { }

    async createComment(storyId: number, uid: any, commentText: string) {
        // get a connection and create a new query runner
        const connection = getConnection();
        const queryRunner = connection.createQueryRunner();

        // establish real database connection using our new query runner
        await queryRunner.connect();

        // open a new transaction:
        await queryRunner.startTransaction();

        try {
            const linkedStory = await this.storyService.readStory(storyId);

            const newComment = new CommentEntity();
            newComment.text = commentText;
            newComment.story = linkedStory;

            // Add current user to like
            const user = new UserEntity();
            user.uid = uid;
            newComment.user = user;

            queryRunner.manager.save(newComment);

            // increment comment count on story
            const incrementCommentOutput = await queryRunner.manager
                .createQueryBuilder()
                .update(StoryEntity)
                .set({ comment_count: linkedStory.comment_count + 1 })
                .where({ id: storyId })
                .execute();

            if (incrementCommentOutput.raw.affectedRows === 0) {
                throw new Error('ID does not exist.');
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

    async deleteComment(storyId: number, commentId: number) {
        // get a connection and create a new query runner
        const connection = getConnection();
        const queryRunner = connection.createQueryRunner();

        // establish real database connection using our new query runner
        await queryRunner.connect();

        // open a new transaction:
        await queryRunner.startTransaction();

        try {
            const linkedStory = await this.storyService.readStory(storyId);

            // delete comment on story
            const deleteCommentOutput = await queryRunner.manager
                .createQueryBuilder()
                .delete()
                .from(CommentEntity)
                .where({ id: commentId })
                .execute();

            // decrement like count on story
            const decrementCommentOutput = await queryRunner.manager
                .createQueryBuilder()
                .update(StoryEntity)
                .set({ comment_count: linkedStory.comment_count - 1 })
                .where({ id: storyId })
                .execute();

            if (decrementCommentOutput.raw.affectedRows === 0 || deleteCommentOutput.raw.affectedRows === 0) {
                throw new Error('ID does not exist.');
            }

        } catch (err) {
            // since we have errors lets rollback changes made
            await queryRunner.rollbackTransaction();

        } finally {
            // release query runner which is manually created
            await queryRunner.release();
        }
    }
}