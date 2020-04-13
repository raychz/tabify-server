import { Entity, OneToOne, PrimaryGeneratedColumn, Index, JoinColumn, Column } from 'typeorm';
import { User, PaymentMethod } from '@tabify/entities';

@Entity()
export class UserSetting{

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'int', nullable: false })
    defaultTipPercentage!: number;

    // one to one - join column on this side - settings has a column but payment method doesn't
    @OneToOne(type => PaymentMethod, paymentMethod => paymentMethod ,{onDelete: 'CASCADE'}) // Check if the user changes a Payment Method (only removes it) but does not delete the payment method
    @JoinColumn()
    defaultPaymentMethod?: PaymentMethod;
    

    // Bi-directional one-to-one
    @Index()
    @OneToOne(type => User, user => user.userSettings, { onDelete: 'CASCADE' })
    @JoinColumn()
    user!: User;
}



  