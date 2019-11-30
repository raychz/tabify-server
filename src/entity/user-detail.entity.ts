import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { Server, User } from '@tabify/entities';

@Entity()
export class UserDetail {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', nullable: false })
    displayName!: string;

    @Column({ type: 'varchar', nullable: false })
    email!: string;

    @Column({ type: 'varchar', nullable: true })
    photo_url!: string;

    // Bi-directional one-to-one
    @OneToOne(type => User, user => user.userDetail, { onDelete: 'CASCADE' })
    @JoinColumn()
    user!: User;

    @ManyToOne(type => Server, server => server.users)
    server!: Server;

    // stored as int in MySQL. 1 = True, 0 = False
    @Column({type: 'boolean', nullable: false, default: true})
    newUser!: boolean;
}