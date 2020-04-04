import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { Comment, Like, Ticket, TabifyBaseEntity } from '@tabify/entities';

@Entity()
export class Story extends TabifyBaseEntity {
    @OneToMany(type => Comment, comment => comment.story)
    comments!: Comment[];

    @Column({ type: 'int', nullable: false, default: 0 })
    comment_count!: number;

    @OneToMany(type => Like, like => like.story)
    likes!: Like[];

    // Bi-directional one-to-one
    @OneToOne(type => Ticket, ticket => ticket.story, { onDelete: 'CASCADE' })
    @JoinColumn()
    ticket!: Ticket;

}