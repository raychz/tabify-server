import { Entity, Column, ManyToMany, OneToMany, OneToOne } from 'typeorm';
import { Comment, FraudPreventionCode, Like, Ticket, TicketItem, TicketPayment, UserDetail, PaymentMethod, TicketItemUser, TicketUser } from '@tabify/entities';

@Entity()
export class User {
  @Column('varchar', { length: 255, primary: true, nullable: false })
  uid!: string;

  @OneToMany(type => TicketItemUser, ticketItemUser => ticketItemUser.user)
  ticketItemUsers!: TicketItemUser[];

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

  @OneToOne(type => UserDetail, userDetail => userDetail.user)
  userDetail!: UserDetail;

  @OneToMany(type => TicketUser, ticketUser => ticketUser.user)
  ticketUsers!: TicketUser[];
}
