import { Controller, Query, Res, Post, Param, Delete, Body, Get } from '@nestjs/common';
import { CommentService } from '@tabify/services';
import { User } from '../decorators/user.decorator';

@Controller('stories/:storyId/comments')
export class CommentController {
  constructor(
    private readonly commentService: CommentService,
  ) { }

  @Get()
  async getComments(@Param('storyId') storyId: number) {
    const comments = await this.commentService.readComments(storyId);
    return comments;
  }

  @Post()
  async postComment(
    @User('uid') uid: string,
    @Param('storyId') storyId: number,
    @Body('newComment') newComment: string,
  ) {
    const response = await this.commentService.createComment(storyId, uid, newComment);
    return response;
  }

  @Delete(':commentId')
  async deleteComment(
    @User('uid') uid: string,
    @Param('storyId') storyId: number,
    @Param('commentId') commentId: number,
  ) {
    const response = await this.commentService.deleteComment(storyId, commentId, uid);

    return response;
  }
}