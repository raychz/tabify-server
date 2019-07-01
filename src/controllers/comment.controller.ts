import { Controller, Query, Res, Post, Param, Delete, Body } from '@nestjs/common';
import { Response as ServerResponse } from 'express-serve-static-core';
import { CommentService } from 'src/services/comment.service';

@Controller('stories/:storyId/comments')
export class CommentController {
  constructor(
    private readonly commentService: CommentService,
  ) { }

  @Post()
  async postComment(
    @Param('storyId') storyId: number,
    @Body('commentText') commentText: string,
    @Res() res: ServerResponse) {
    // get currently logged-in user
    const {
      locals: {
        auth: { uid },
      },
    } = res;

    await this.commentService.createComment(storyId, uid, commentText);
    res.send('Comment Posted');
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