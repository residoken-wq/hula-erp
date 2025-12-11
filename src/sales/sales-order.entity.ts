import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { SalesOrderItem } from './sales-order-item.entity';
import { Customer } from '../customers/customer.entity';
import { ProductionPlan } from '../planning/production-plan.entity';

export enum SalesOrderStatus {
  QUOTATION = 'QUOTATION',   
  SO_PENDING = 'SO_PENDING', 
  DEPOSITED = 'DEPOSITED',   // Đã đặt cọc -> Đủ điều kiện lên Plan
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

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ nullable: true })
  customer_id: number;

  @Column({ nullable: true })
  customer_name: string;

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

  // --- MỚI: NGÀY GIAO HÀNG DỰ KIẾN ---
  @Column({ type: 'date', nullable: true })
  delivery_date: Date;
  // -----------------------------------

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
EOF

# 2. Tạo Entity ProductSample (Quản lý mẫu)
cat << 'EOF' > src/sales/product-sample.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from '../customers/customer.entity';

export enum SampleStatus {
  REQUESTED = 'REQUESTED',   // Khách yêu cầu
  MAKING = 'MAKING',         // Đang may mẫu
  SENT = 'SENT',             // Đã gửi khách
  APPROVED = 'APPROVED',     // Khách duyệt
  REJECTED = 'REJECTED'      // Khách từ chối (Phải sửa)
}

@Entity('product_samples')
export class ProductSample {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sample_code: string; // Mã mẫu

  @Column()
  product_name: string; // Tên mẫu

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ nullable: true })
  customer_id: number;

  @Column({
    type: 'enum',
    enum: SampleStatus,
    default: SampleStatus.REQUESTED
  })
  status: SampleStatus;

  @Column({ type: 'date', nullable: true })
  request_date: Date; // Ngày yêu cầu

  @Column({ type: 'date', nullable: true })
  deadline_date: Date; // Hạn chót gửi mẫu

  @Column({ nullable: true })
  feedback: string; // Ý kiến khách hàng

  @Column({ nullable: true })
  image_url: string; // Ảnh mẫu

  @CreateDateColumn()
  created_at: Date;
}