import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Comment } from './comment.entity';
import { User } from '.';
import { Like } from './like.entity';
import { Ticket } from './ticket.entity';
import { type } from 'os';

@Entity()
export class Story {

    @PrimaryGeneratedColumn()
    id!: number;

    @OneToMany(() => Comment, comment => comment.story)
    comments!: Comment[];

    @Column({ type: 'int', nullable: false })
    like_count!: number;

    @Column({ type: 'int', nullable: false })
    comment_count!: number;

    @OneToMany(() => Like, like => like.story)
    likes!: Like[];

    // Bi-directional one-to-one
    @OneToOne(() => Ticket, ticket => ticket.story)
    @JoinColumn()
    ticket!: Ticket;

    @CreateDateColumn()
    date_created!: Date;
}