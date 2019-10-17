import { Entity, PrimaryGeneratedColumn, ManyToOne, Unique } from 'typeorm';
import { Story, User } from '@tabify/entities';

@Entity()
@Unique(['story', 'user']) // A user can like a story only once
export class Like {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(type => Story, story => story.likes)
    story!: Story;

    @ManyToOne(type => User, user => user.likes)
    user!: User;
}