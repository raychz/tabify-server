import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Ticket, User } from '@tabify/entities';

@Entity()
export class PaymentMethod {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', nullable: false })
  token!: string;

  @Column({ type: 'varchar', nullable: false })
  last_four_digits!: string;

  @Column({ type: 'varchar', nullable: false })
  card_type!: string;

  @Column({ type: 'varchar', nullable: false })
  first_name!: string;

  @Column({ type: 'varchar', nullable: false })
  last_name!: string;

  @Column({ type: 'varchar', nullable: false })
  full_name!: string;

  @Column({ type: 'int', nullable: false })
  month!: number;

  @Column({ type: 'int', nullable: false })
  year!: number;

  @CreateDateColumn()
  date_created!: Date;

  @UpdateDateColumn()
  date_updated!: Date;
}
