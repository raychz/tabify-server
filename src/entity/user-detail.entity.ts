import { Entity, Column, OneToMany, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class UserDetail {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({type: 'varchar', nullable: false})
    displayName!: string;

    @Column({ type: 'varchar', nullable: false })
    email!: string;

    @Column({type: 'varchar', nullable: true})
    photo_url!: string;

    // Bi-directional one-to-one
    @OneToOne(type => User, user => user.userDetail)
    @JoinColumn()
    user!: User;
}