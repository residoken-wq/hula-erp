import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany, ManyToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { SalesOrderItem } from './sales-order-item.entity';
import { Customer } from '../customers/customer.entity';
import { ProductionPlan } from '../planning/production-plan.entity';
import { Transaction } from '../finance/transaction.entity'; // De link history

export enum SalesOrderStatus {
  QUOTATION = 'QUOTATION',   
  SO_PENDING = 'SO_PENDING', 
  DEPOSITED = 'DEPOSITED',   
  PLANNED = 'PLANNED',
  PARTIAL_DELIVERY = 'PARTIAL_DELIVERY', // Mới: Giao 1 phần
  DELIVERED = 'DELIVERED',   // Mới: Giao xong
  COMPLETED = 'COMPLETED',   // Hoàn tất (Giao xong + Trả đủ tiền)
  CANCELLED = 'CANCELLED'    
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PARTIAL_PAID = 'PARTIAL_PAID',
  PAID = 'PAID'
}

@Entity('sales_orders')
export class SalesOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  order_code: string; 

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ nullable: true })
  customer_id: number;

  @Column({ nullable: true })
  customer_name: string;

  // --- VAT & LOGISTICS ---
  @Column({ nullable: true })
  vat_company_name: string;
  @Column({ nullable: true })
  vat_tax_code: string; 
  @Column({ nullable: true })
  vat_address: string;
  
  @Column({ type: 'date', nullable: true })
  delivery_date: Date; // DEADLINE CHO SAN XUAT
  
  @Column({ nullable: true })
  shipping_address: string;
  @Column({ nullable: true })
  receiver_name: string;
  @Column({ nullable: true })
  receiver_phone: string;
  @Column({ nullable: true })
  shipping_carrier: string;
  @Column({ nullable: true })
  tracking_code: string;
  @Column('decimal', { default: 0 })
  shipping_fee: number;

  // --- PAYMENT ---
  @Column('text', { nullable: true })
  payment_note: string;
  
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  paid_amount: number;

  @Column({
      type: 'enum',
      enum: PaymentStatus,
      default: PaymentStatus.UNPAID
  })
  payment_status: PaymentStatus;

  // --- PRODUCTION LINK ---
  @ManyToOne(() => ProductionPlan, (plan) => plan.sales_orders, { nullable: true })
  @JoinColumn({ name: 'plan_id' })
  production_plan: ProductionPlan;

  @Column({ nullable: true })
  plan_id: number;

  @Column({
    type: 'enum',
    enum: SalesOrderStatus,
    default: SalesOrderStatus.QUOTATION
  })
  status: SalesOrderStatus;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  total_amount: number; 

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  total_cost: number; 

  @OneToMany(() => SalesOrderItem, (item) => item.order, { cascade: true })
  items: SalesOrderItem[];

  @CreateDateColumn()
  order_date: Date;

  @UpdateDateColumn()
  updated_at: Date;
}