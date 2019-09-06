import { Get, Controller, Query, Res, Post, Body, Param } from '@nestjs/common';
import { Response as ServerResponse } from 'express-serve-static-core';
import { StoryService } from '@tabify/services';

@Controller('stories')
export class StoryController {
    constructor(
        private readonly storyService: StoryService,
    ) { }

    @Get()
    async getStories(@Res() res: ServerResponse, @Query() params: any) {
        // get currently logged-in user
        const {
            locals: {
              auth: { uid },
            },
          } = res;

        const stories = await this.storyService.readStories(uid);
        res.send(stories);
    }

    @Get(':storyId')
    async getDetailedStory(
      @Res() res: ServerResponse,
      @Param('storyId') storyId: number,
      @Query() params: any) {

      const story = await this.storyService.readDetailedStory(storyId);
      res.send(story);
  }
}