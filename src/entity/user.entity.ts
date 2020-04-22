import { Entity, Column, ManyToMany, OneToMany, OneToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Comment, FraudPreventionCode, Like, Ticket, TicketItem, TicketPayment, UserDetail, PaymentMethod, TicketItemUser, TicketUser } from '@tabify/entities';
import { LocationReview } from './location-review.entity';
import { TicketItemReview } from './ticket-item-review.entity';

@Entity()
export class User {
  @Column('varchar', { length: 255, primary: true, nullable: false })
  uid!: string;

  @CreateDateColumn()
  date_created?: Date;

  @UpdateDateColumn()
  date_updated?: Date;

  @OneToMany(type => TicketItemUser, ticketItemUser => ticketItemUser.user)
  ticketItems!: TicketItemUser[];

  @OneToMany(type => FraudPreventionCode, fraudPreventionCode => fraudPreventionCode.id)
  fraudPreventionCodes!: FraudPreventionCode[];

  @OneToMany(type => PaymentMethod, paymentMethod => paymentMethod.id)
  paymentMethods!: PaymentMethod[];

  @OneToMany(type => Comment, comment => comment.user)
  comments!: Comment[];

  @OneToMany(type => Like, like => like.user)
  likes!: Like[];

  @OneToMany(type => TicketPayment, ticketPayment => ticketPayment.user)
  ticketPayments!: TicketPayment[];

  @OneToMany(type => LocationReview, locationReview => locationReview.user)
  location_reviews!: LocationReview[];

  @OneToMany(type => TicketItemReview, ticketItemReview => ticketItemReview.user)
  item_reviews!: TicketItemReview[];

  @OneToOne(type => UserDetail, userDetail => userDetail.user)
  userDetail!: UserDetail;

  @OneToMany(type => TicketUser, ticketUser => ticketUser.user)
  tickets!: TicketUser[];
}
