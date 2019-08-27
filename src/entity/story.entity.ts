import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Comment } from './comment.entity';
import { Like } from './like.entity';
import { Ticket } from './ticket.entity';

@Entity()
export class Story {
    @PrimaryGeneratedColumn()
    id!: number;

    @OneToMany(type => Comment, comment => comment.story)
    comments!: Comment[];

    @Column({ type: 'int', nullable: false, default: 0})
    comment_count!: number;

    @OneToMany(type => Like, like => like.story)
    likes!: Like[];

    // Bi-directional one-to-one
    @OneToOne(type => Ticket, ticket => ticket.story)
    @JoinColumn()
    ticket!: Ticket;

    @CreateDateColumn()
    date_created!: Date;
}