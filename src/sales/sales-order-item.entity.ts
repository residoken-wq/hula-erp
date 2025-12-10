import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SalesOrder } from './sales-order.entity';

@Entity('sales_order_items')
export class SalesOrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => SalesOrder, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: SalesOrder;

  @Column()
  sku: string; // Ma san pham (Link voi bang Product)

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 15, scale: 2 })
  unit_price: number; // Gia ban thuc te (Sale nhap)

  @Column('decimal', { precision: 15, scale: 2 })
  subtotal: number; // = quantity * unit_price
}
