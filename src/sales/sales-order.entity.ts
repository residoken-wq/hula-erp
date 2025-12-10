import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { SalesOrderItem } from './sales-order-item.entity';

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
}
