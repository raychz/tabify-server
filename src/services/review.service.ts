import { Injectable, Logger } from '@nestjs/common';
import { LocationReview, TicketItemReview, User } from '@tabify/entities';
import { getManager, EntityManager } from 'typeorm';

@Injectable()
export class ReviewService {

    async postReviews(reviews: {location: LocationReview, ticket_items: TicketItemReview[]}, uid: string) {
        return await getManager().transaction(async (transactionalEntityManager: EntityManager) => {
            let total_item_ratings = 0;
            let total_item_ratings_count = 0;

            const return_dto: any = {};
            const user: User = new User();
            user.uid = uid;

            const db_ticket_item_reviews = [];
            for (const ticketItemReview of reviews.ticket_items) {
                if (ticketItemReview.rating > 0 && ticketItemReview.rating <= 5) {
                    ticketItemReview.user = user;
                    const db_ticket_item_review = await transactionalEntityManager.save(TicketItemReview, ticketItemReview);
                    db_ticket_item_reviews.push(db_ticket_item_review);
                    total_item_ratings += ticketItemReview.rating;
                    total_item_ratings_count += 1;
                }
            }

            return_dto.ticket_items = db_ticket_item_reviews;

            const location_review = reviews.location;
            if (total_item_ratings_count > 0) {
                const average_item_rating = total_item_ratings / total_item_ratings_count;
                location_review.average_item_rating = average_item_rating;
            }

            if (location_review.average_item_rating || location_review.location_rating) {
                location_review.user = user;
                const db_location_review = await transactionalEntityManager.save(LocationReview, location_review);
                return_dto.location = db_location_review;
            }

            try {
                transactionalEntityManager.queryRunner!.commitTransaction();
              } catch (error) {
                transactionalEntityManager.queryRunner!.rollbackTransaction();
              }
            return return_dto;
          });
    }

}