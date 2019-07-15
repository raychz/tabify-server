import { Entity, Column, ManyToMany, OneToMany, JoinTable, OneToOne } from 'typeorm';
import { Ticket, TicketItem, FraudPreventionCode } from '.';
import { Comment } from './comment.entity';
import { Like } from './like.entity';
import { UserDetail } from './user-detail.entity';

@Entity()
export class User {
  @Column('varchar', { length: 255, primary: true, nullable: false })
  uid!: string;

  @ManyToMany(type => Ticket)
  tickets!: Ticket[];

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
}
