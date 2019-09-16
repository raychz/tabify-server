import { Controller, Query, Res, Post, Param, Delete, Body, Get } from '@nestjs/common';
import { Response as ServerResponse } from 'express-serve-static-core';
import { CommentService } from '@tabify/services';

@Controller('stories/:storyId/comments')
export class CommentController {
  constructor(
    private readonly commentService: CommentService,
  ) { }

  @Get()
  async getComments(
    @Param('storyId') storyId: number,
    @Res() res: ServerResponse) {

    const comments = await this.commentService.readComments(storyId);
    res.send(comments);
  }

  @Post()
  async postComment(
    @Param('storyId') storyId: number,
    @Body('newComment') newComment: string,
    @Res() res: ServerResponse) {
    // get currently logged-in user
    const {
      locals: {
        auth: { uid },
      },
    } = res;

    const response = await this.commentService.createComment(storyId, uid, newComment);

    res.send(response);
  }

  @Delete(':commentId')
  async deleteComment(
    @Param('storyId') storyId: number,
    @Param('commentId') commentId: number,
    @Res() res: ServerResponse) {
    // get currently logged-in user
    const {
      locals: {
        auth: { uid },
      },
    } = res;

    const response = await this.commentService.deleteComment(storyId, commentId, uid);

    res.send(response);
  }
}