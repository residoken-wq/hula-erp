import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { SalesOrderItem } from './sales-order-item.entity';
import { Customer } from '../customers/customer.entity';
import { ProductionPlan } from '../planning/production-plan.entity';

export enum SalesOrderStatus {
  QUOTATION = 'QUOTATION',   
  SO_PENDING = 'SO_PENDING', // Đã chốt đơn
  DEPOSITED = 'DEPOSITED',   // Đã đặt cọc
  PLANNED = 'PLANNED',       // Đã lên kế hoạch
  SHIPPING = 'SHIPPING',     
  COMPLETED = 'COMPLETED',   
  CANCELLED = 'CANCELLED'    
}

@Entity('sales_orders')
export class SalesOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  order_code: string; 

  // --- LIÊN KẾT KHÁCH HÀNG ---
  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ nullable: true })
  customer_id: number;

  @Column({ nullable: true })
  customer_name: string;

  // --- LIÊN KẾT KẾ HOẠCH SX ---
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

  // --- THÔNG TIN VẬN CHUYỂN (CRM) ---
  @Column({ nullable: true })
  shipping_address: string;

  @Column({ default: 'NOT_STARTED' }) 
  shipping_status: string;
  // ----------------------------------

  // --- THÔNG TIN GIAO HÀNG (PLANNING) ---
  @Column({ type: 'date', nullable: true })
  delivery_date: Date;
  // --------------------------------------

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  total_amount: number; 

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  total_cost: number; 

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  paid_amount: number;

  @OneToMany(() => SalesOrderItem, (item) => item.order, { cascade: true })
  items: SalesOrderItem[];

  @CreateDateColumn()
  order_date: Date;
}