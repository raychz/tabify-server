import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, ManyToOne } from 'typeorm';
import { Story, User, TabifyBaseEntity } from '@tabify/entities';
@Entity()
export class Comment extends TabifyBaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', nullable: false })
    text!: string;

    @ManyToOne(type => Story, story => story.comments, { onDelete: 'CASCADE' })
    story!: Story;

    @ManyToOne(type => User, user => user.comments)
    user!: User;

}