import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, ManyToOne, Unique } from 'typeorm';
import { Story, User, TabifyBaseEntity } from '@tabify/entities';

@Entity()
@Unique(['story', 'user']) // A user can like a story only once
export class Like extends TabifyBaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(type => Story, story => story.likes, { onDelete: 'CASCADE' })
    story!: Story;

    @ManyToOne(type => User, user => user.likes)
    user!: User;
}