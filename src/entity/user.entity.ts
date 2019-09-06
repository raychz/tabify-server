import { Entity, Column, ManyToMany, OneToMany, OneToOne } from 'typeorm';
import { Comment, FraudPreventionCode, Like, Ticket, TicketItem, UserDetail } from '@tabify/entities';

@Entity()
export class User {
  @Column('varchar', { length: 255, primary: true, nullable: false })
  uid!: string;

  @ManyToMany(type => TicketItem)
  ticketItems!: TicketItem[];

  @OneToMany(type => FraudPreventionCode, fraudPreventionCode => fraudPreventionCode.id)
  fraudPreventionCodes!: FraudPreventionCode[];

  @OneToMany(type => Comment, comment => comment.user)
  comments!: Comment[];

  @OneToMany(type => Like, like => like.user)
  likes!: Like[];

  // If a user is deleted, delete associated user-details. Not viceversa
  @OneToOne(type => UserDetail, userDetail => userDetail.user, {
    onDelete: 'CASCADE',
  })
  userDetail!: UserDetail;

  @ManyToMany(type => Ticket, ticket => ticket.users)
  tickets!: Ticket[];
}
