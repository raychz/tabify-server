import { Entity, Column, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { TicketItemUser, TabifyBaseEntity, User, TicketItem} from '@tabify/entities';

@Entity()
  export class TicketItemReview extends TabifyBaseEntity {
      @Column({ type: 'int', nullable: false })
      rating!: number;

      @Column({ type: 'varchar', nullable: true })
      feedback?: string;

      @ManyToOne(type => TicketItem, ticketItem => ticketItem.reviews, {nullable: false })
      ticket_item!: TicketItem;

      @ManyToOne(type => User, user => user.item_reviews)
      user!: User;
  }
