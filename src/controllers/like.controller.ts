import { Get, Controller, Query, Res, Post, Body, Param } from '@nestjs/common';
import { async } from 'rxjs/internal/scheduler/async';
import { resolve } from 'path';
import { Response as ServerResponse } from 'express-serve-static-core';
import { LikeService } from 'src/services/like.service';

@Controller('stories/:storyId/likes')
export class LikeController {
  constructor(
    private readonly likeService: LikeService,
  ) { }

  @Post()
  async postLike(@Param('storyId') storyId: number, @Res() res: ServerResponse, @Query() params: any) {

    // get currently logged-in user
    const {
      locals: {
        auth: { uid },
      },
    } = res;

    const stories = await this.likeService.createLike(storyId, uid);
    res.send('liked!');
  }
}