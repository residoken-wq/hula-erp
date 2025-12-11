import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany, ManyToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { SalesOrderItem } from './sales-order-item.entity';
import { Customer } from '../customers/customer.entity';
import { ProductionPlan } from '../planning/production-plan.entity';

export enum SalesOrderStatus {
  QUOTATION = 'QUOTATION',   
  SO_PENDING = 'SO_PENDING', 
  DEPOSITED = 'DEPOSITED',   
  PLANNED = 'PLANNED',       
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

  // --- KHACH HANG ---
  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ nullable: true })
  customer_id: number;

  @Column({ nullable: true })
  customer_name: string; // Tên hiển thị (Người mua)

  // --- THONG TIN PHAP NHAN VAT (HOA DON) ---
  @Column({ nullable: true })
  vat_company_name: string; // Tên đơn vị mua hàng (trên hóa đơn)

  @Column({ nullable: true })
  vat_tax_code: string; // MST

  @Column({ nullable: true })
  vat_address: string; // Địa chỉ ĐKKD
  // ----------------------------------------

  // --- QUAN LY GIAO HANG (LOGISTICS) ---
  @Column({ type: 'date', nullable: true })
  delivery_date: Date; // Ngày giao dự kiến

  @Column({ nullable: true })
  shipping_address: string; // Địa chỉ nhận hàng

  @Column({ nullable: true })
  receiver_name: string; // Người nhận

  @Column({ nullable: true })
  receiver_phone: string; // SĐT nhận

  @Column({ nullable: true })
  shipping_carrier: string; // Đơn vị vận chuyển (GHTK, Viettel...)

  @Column({ nullable: true })
  tracking_code: string; // Mã vận đơn

  @Column('decimal', { default: 0 })
  shipping_fee: number; // Phí ship
  // -------------------------------------

  // --- THANH TOAN ---
  @Column('text', { nullable: true })
  payment_note: string; // Ghi chú thanh toán (VD: CK 50% trước...)
  
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  paid_amount: number; // Đã thanh toán
  // ------------------

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