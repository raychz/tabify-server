import { Controller, Query, Res, Post, Param, Header, Put } from '@nestjs/common';
import { Response as ServerResponse } from 'express-serve-static-core';
import { LikeService } from 'src/services/like.service';

@Controller('stories/:storyId/likes')
export class LikeController {
  constructor(
    private readonly likeService: LikeService,
  ) { }

  @Post()
  async postLike(
    @Param('storyId') storyId: number,
    @Res() res: ServerResponse) {
    // get currently logged-in user
    const {
      locals: {
        auth: { uid },
      },
    } = res;

    await this.likeService.handleLike(storyId, uid);
  }
}