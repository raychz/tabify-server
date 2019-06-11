import { Entity, Column, ManyToMany, OneToMany, JoinTable } from 'typeorm';
import { Ticket, TicketItem, FraudPreventionCode } from '.';
import { Comment } from './comment.entity';
import { Like } from './like.entity';

@Entity()
export class User {
  @Column('varchar', { length: 255, primary: true, nullable: false })
  uid!: string;

  @ManyToMany(type => Ticket)
  @JoinTable()
  tickets!: Ticket[];

  @ManyToMany(type => TicketItem)
  ticketItems!: TicketItem[];

  @OneToMany(type => FraudPreventionCode, fraudPreventionCode => fraudPreventionCode.id)
  fraudPreventionCodes!: FraudPreventionCode[];

  @OneToMany(type => Comment, comment => comment.user)
  comments!: Comment[];

  @OneToMany(type => Like, like => like.user)
  likes!: Like[];
}
