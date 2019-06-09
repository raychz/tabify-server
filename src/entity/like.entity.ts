import {Entity, PrimaryGeneratedColumn, Column, ManyToMany, ManyToOne} from 'typeorm';
import { Story } from './story.entity';
import { User } from './user.entity';

@Entity()
export class Like {

    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(type => Story, story => story.likes)
    story!: Story;

    @ManyToOne(type => User, user => user.likes)
    user!: User;
}