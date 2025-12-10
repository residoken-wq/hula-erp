import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { SalesOrderItem } from './sales-order-item.entity';
import { Customer } from '../customers/customer.entity';

export enum SalesOrderStatus {
  DRAFT = 'DRAFT',           // Nháp
  CONFIRMED = 'CONFIRMED',   // Đã chốt (Tính công nợ)
  PLANNED = 'PLANNED',       // Đã vào Kế hoạch SX (KHÓA ĐƠN - Không sửa xóa)
  COMPLETED = 'COMPLETED',   // Đã giao hàng xong
  CANCELLED = 'CANCELLED'
}

@Entity('sales_orders')
export class SalesOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  order_code: string; 

  @Column()
  customer_name: string; 

  @Column({ default: 'DRAFT' })
  status: string; 

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  total_amount: number; 

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  total_cost: number; 

  // --- MOI THEM: So tien khach da tra ---
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  paid_amount: number;
  // -------------------------------------

  @OneToMany(() => SalesOrderItem, (item) => item.order, { cascade: true })
  items: SalesOrderItem[];

  @CreateDateColumn()
  order_date: Date;

  @Column({
    type: 'enum',
    enum: SalesOrderStatus,
    default: SalesOrderStatus.DRAFT
  })
  status: SalesOrderStatus;

  // --- LIÊN KẾT CRM ---
  @ManyToOne(() => Customer, (customer) => customer.orders)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ nullable: true })
  customer_id: number;
  // -------------------
}
}
