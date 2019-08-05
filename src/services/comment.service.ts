import { Injectable, BadRequestException } from '@nestjs/common';
import { Story as StoryEntity } from '../entity';
import { Comment as CommentEntity } from '../entity';
import { User as UserEntity } from '../entity';
import { getConnection, getRepository } from 'typeorm';
import { StoryService } from './story.service';
import { UserService } from './user.service';

@Injectable()
export class CommentService {

    constructor(
        private storyService: StoryService,
        private userService: UserService,
    ) { }

    // read comments of a particular story
    async readComments(storyId: number) {
        const commentRepo = await getRepository(CommentEntity);
        const comments = await commentRepo.find({
            where: { story: storyId }, relations: ['user', 'user.userDetail'],
        });

        return comments;
    }

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

            // store new comment inserted
            const newCommentInserted = await queryRunner.manager.save(newComment);
            delete newCommentInserted.story;

            // increment comment count on story
            const incrementCommentOutput = await queryRunner.manager
                .createQueryBuilder()
                .update(StoryEntity)
                .set({ comment_count: linkedStory.comment_count + 1 })
                .where({ id: storyId })
                .execute();

            if (incrementCommentOutput.raw.affectedRows === 0) {
                throw new Error('Story does not exist.');
            }

            // add user details to newly created
            newCommentInserted.user.userDetail = await this.userService.getUserDetails(uid);

            // commit transaction
            await queryRunner.commitTransaction();

            // return the newly created comment
            return newCommentInserted;

        } catch (e) {
            // since we have errors lets rollback changes made
            await queryRunner.rollbackTransaction();

            if (e === 'Story ID does not exist.') {
                throw new BadRequestException('Story does not exist', e);
            } else {
                throw new BadRequestException('An unknown error occurred', e);
            }

        } finally {
            // release query runner which is manually created
            await queryRunner.release();
        }
    }

    async deleteComment(storyId: number, commentId: number, uid: string) {
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
                .where({ id: commentId, user: uid })
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

            // commit transaction
            await queryRunner.commitTransaction();

            return deleteCommentOutput;

        } catch (e) {
            // since we have errors lets rollback changes made
            await queryRunner.rollbackTransaction();

            throw new BadRequestException('An error occured while deleting the comment', e);

        } finally {
            // release query runner which is manually created
            await queryRunner.release();
        }
    }
}