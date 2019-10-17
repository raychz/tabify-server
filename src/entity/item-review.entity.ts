import { Entity, PrimaryGeneratedColumn, ManyToOne, Unique } from 'typeorm';
import { Story, User } from '@tabify/entities';

@Entity()
export class ItemReview {
    @PrimaryGeneratedColumn()
    id!: number;
}