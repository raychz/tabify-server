import { Entity, OneToOne, PrimaryGeneratedColumn, Index, JoinColumn } from 'typeorm';
import { User } from '@tabify/entities';

@Entity()
export class UserSettings{

    @PrimaryGeneratedColumn()
    id!: number;

    


    // Bi-directional one-to-one
    @Index()
    @OneToOne(type => User, user => user.userSettings, { onDelete: 'CASCADE' })
    @JoinColumn()
    user!: User;
}



  