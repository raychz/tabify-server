import { Controller, Query, Res, Post, Param, Delete, Body, Get } from '@nestjs/common';
import { Response as ServerResponse } from 'express-serve-static-core';
import { CommentService } from 'src/services/comment.service';
import { async } from 'rxjs/internal/scheduler/async';

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

    const status = await this.commentService.createComment(storyId, uid, newComment);

    if (status === true) {
      res.status(201).send();
    } else {
      res.status(500).send();
    }
  }

  @Delete(':commentId')
  async deleteComment(
    @Param('storyId') storyId: number,
    @Param('commentId') commentId: number,
    @Res() res: ServerResponse) {

    await this.commentService.deleteComment(storyId, commentId);
    res.send('Comment Deleted');
  }
}