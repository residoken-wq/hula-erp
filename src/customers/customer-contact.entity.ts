import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from './customer.entity';

@Entity('customer_contacts')
export class CustomerContact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  full_name: string;

  @Column({ nullable: true })
  job_title: string; // Chức danh: Giám đốc, Kế toán...

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @ManyToOne(() => Customer, (customer) => customer.contacts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;
}