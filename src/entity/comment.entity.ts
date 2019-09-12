import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, ManyToOne, CreateDateColumn } from 'typeorm';
import { Story, User } from '@tabify/entities';

@Entity()
export class Comment {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', nullable: false })
    text!: string;

    @ManyToOne(type => Story, story => story.comments)
    story!: Story;

    @ManyToOne(type => User, user => user.comments)
    user!: User;

    @CreateDateColumn()
    date_created!: Date;
}