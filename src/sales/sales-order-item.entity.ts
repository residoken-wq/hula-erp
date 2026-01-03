import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SalesOrder } from './sales-order.entity';
import { Product } from '../products/product.entity'; // Import Product Entity

@Entity('sales_order_items')
export class SalesOrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 0 })
  position: number;

  @ManyToOne(() => SalesOrder, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: SalesOrder;

  @Column()
  sku: string;

  // --- QUAN TRỌNG: Relation với Product ---
  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  // Lưu ý: Nếu DB bạn chưa có cột product_id, hãy dùng referencedColumnName='sku' và joinColumn name='sku' nếu cần, 
  // nhưng chuẩn nhất là mapping qua ID hoặc SKU nếu Entity Product dùng SKU làm khóa chính.
  // Ở đây giả sử ta map lỏng qua SKU bằng cách join thủ công trong Service,
  // NHƯNG để TypeORM relations hoạt động, ta cần định nghĩa nó.
  // NẾU KHÔNG THỂ SỬA DB, HÃY DÙNG CÁCH DƯỚI:
  product: Product;
  // ----------------------------------------

  @Column('text', { nullable: true })
  image_url: string; // Snapshot image from product at time of order

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;

  @Column('decimal', { precision: 15, scale: 2 })
  unit_price: number;

  @Column('decimal', { precision: 15, scale: 2 })
  subtotal: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  total_price: number;

  @Column({ nullable: true })
  variant_color: string;

  @Column({ default: false })
  is_sample_approved: boolean;

  @Column('text', { nullable: true })
  sample_image: string;

  @Column({ nullable: true })
  sample_note: string;


  @Column('text', { nullable: true })
  vat_content: string;
}