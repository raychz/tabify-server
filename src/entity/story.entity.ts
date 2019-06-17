import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { Comment } from './comment.entity';
import { User } from '.';
import { Like } from './like.entity';
import { Ticket } from './ticket.entity';

@Entity()
export class Story {
    @PrimaryGeneratedColumn()
    id!: number;

    @OneToMany(type => Comment, comment => comment.story)
    comments!: Comment[];

    @Column({ type: 'int', nullable: false })
    like_count!: number;

    @Column({ type: 'int', nullable: false })
    comment_count!: number;

    @OneToMany(type => Like, like => like.story)
    likes!: Like[];

  // Bi-directional one-to-one
  @OneToOne(type => Ticket, ticket => ticket.story)
  @JoinColumn()
  ticket!: Ticket;
}