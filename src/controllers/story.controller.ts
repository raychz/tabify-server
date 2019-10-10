import { Get, Controller, Query, Res, Post, Body, Param } from '@nestjs/common';
import { StoryService } from '@tabify/services';
import { User } from '../decorators/user.decorator';

@Controller('stories')
export class StoryController {
  constructor(
    private readonly storyService: StoryService,
  ) { }

  @Get()
  async getStories(
    @User('uid') uid: string,
    @Query() params: any,
  ) {
    const stories = await this.storyService.readStories(uid);
    return stories;
  }

  @Get(':storyId')
  async getDetailedStory(
    @User('uid') uid: string,
    @Param('storyId') storyId: number,
  ) {

    const story = await this.storyService.readDetailedStory(storyId);
    return story;
  }

  @Get(':storyId/likers')
  async getStoryLikers(
    @User('uid') uid: string,
    @Param('storyId') storyId: number,
  ) {

    const likers = await this.storyService.getStoryLikers(storyId);
    return likers;
  }
}