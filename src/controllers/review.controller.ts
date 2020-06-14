import { Controller, Post, Body, Param, Logger } from '@nestjs/common';
import { ReviewService } from '@tabify/services';
import { User } from '../decorators/user.decorator';
import { LocationReview, TicketItemReview } from '@tabify/entities';

@Controller('reviews')
export class ReviewController {
  constructor(
    private readonly reviewService: ReviewService,
  ) { }

  @Post()
  async postReviews(
    @User('uid') uid: string,
    @Body() reviews: {location: LocationReview, ticket_items: TicketItemReview[]},
  ) {
    const response = await this.reviewService.postReviews(reviews, uid);
    return response;
  }
}