import { Entity, Column, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { TabifyBaseEntity, TicketUser, User, Location} from '@tabify/entities';

@Entity()
  export class LocationReview extends TabifyBaseEntity {
      @Column({ type: 'int', nullable: true })
      location_rating?: number;

      // average of all the ticket-item reviews for the ticket user submitting the review
      @Column({ type: 'int', nullable: true })
      average_item_rating?: number;

      @Column({ type: 'varchar', nullable: true })
      feedback?: string;

      @OneToOne(type => TicketUser, ticketUser => ticketUser.location_review, {nullable: true })
      @JoinColumn()
      ticket_user?: TicketUser;

      @ManyToOne(type => Location, location => location.reviews)
      location!: Location;

      @ManyToOne(type => User, user => user.location_reviews)
      user!: User;
  }
