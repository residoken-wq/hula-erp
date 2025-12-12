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
  sku: string;

  // --- MỚI: BIẾN THỂ & DUYỆT MẪU ---
  @Column({ nullable: true })
  variant_color: string; // Màu chốt (nếu khác SKU gốc)

  @Column({ default: false })
  is_sample_approved: boolean; // Đã duyệt mẫu chưa?

  @Column('text', { nullable: true })
  sample_image: string; // Ảnh mẫu đã duyệt cho dòng này

  @Column('text', { nullable: true })
  sample_note: string; // Ghi chú kỹ thuật cho dòng này
  // --------------------------------

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;

  @Column('decimal', { precision: 15, scale: 2 })
  unit_price: number;

  @Column('decimal', { precision: 15, scale: 2 })
  subtotal: number;
}