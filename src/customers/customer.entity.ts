import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { SalesOrder } from '../sales/sales-order.entity';

export enum CustomerType {
  LEAD = 'LEAD',         // Khách tiềm năng (Chưa chốt đơn)
  CUSTOMER = 'CUSTOMER'  // Khách chính thức (Đã có đơn)
}

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string; 

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: CustomerType,
    default: CustomerType.LEAD
  })
  type: CustomerType;

  // --- CRM: Lịch sử chăm sóc (Follow Lead) ---
  // Lưu mảng JSON: [{ date: '...', note: 'Gọi điện lần 1', user: 'Admin' }]
  @Column('jsonb', { nullable: true, default: [] })
  history: any;
  // ------------------------------------------

  @Column({ nullable: true })
  tax_code: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  address: string;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  credit_limit: number; 

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  current_debt: number;

  @OneToMany(() => SalesOrder, (order) => order.customer)
  orders: SalesOrder[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}