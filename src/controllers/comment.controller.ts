import { Get, Controller, Query, Res, Post, Body } from '@nestjs/common';
import { StoryService } from '../services/story.service';
import { async } from 'rxjs/internal/scheduler/async';
import { resolve } from 'path';
import { Response as ServerResponse } from 'express-serve-static-core';

@Controller('stories')
export class CommentController {
    constructor(
        private readonly storyService: StoryService,
    ) { }

    @Get()
    async test(@Res() res: ServerResponse, @Query() params: any) {

        // get currently logged-in user
        const {
            locals: {
              auth: { uid },
            },
          } = res;

        const stories = await this.storyService.readStories(uid);
        res.send(stories);
    }

    // API: Handle new like.
}