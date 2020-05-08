import { Entity, OneToOne, PrimaryGeneratedColumn, Index, JoinColumn, Column } from 'typeorm';
import { User, PaymentMethod, TabifyBaseEntity } from '@tabify/entities';

@Entity()
export class UserSetting extends TabifyBaseEntity{

    @Column({ type: 'int', nullable: false })
    defaultTipPercentage!: number;

    // one to one - join column on this side - settings has a column but payment method doesn't
    @OneToOne(type => PaymentMethod, paymentMethod => paymentMethod.userSettings,{ nullable: true }) // Check if the user changes a Payment Method (only removes it) but does not delete the payment method
    @JoinColumn()
    defaultPaymentMethod?: PaymentMethod;
    

    // Bi-directional one-to-one
    @Index()
    @OneToOne(type => User, user => user.userSettings, { nullable: false })
    @JoinColumn()
    user!: User;
}



  