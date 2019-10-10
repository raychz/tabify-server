import { Controller, Query, Res, Post, Param, Header, Put, HttpStatus } from '@nestjs/common';
import { LikeService } from '@tabify/services';
import { User } from '../decorators/user.decorator';

@Controller('stories/:storyId/likes')
export class LikeController {
  constructor(
    private readonly likeService: LikeService,
  ) { }

  @Post()
  async postLike(
    @User('uid') uid: string,
    @Param('storyId') storyId: number,
  ) {
    const response = await this.likeService.handleLike(storyId, uid);
    return response;
  }
}