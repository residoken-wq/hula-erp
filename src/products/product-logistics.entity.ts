import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('product_logistics')
export class ProductLogistics {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: number;

  // --- CẬP NHẬT: Dùng 'name' để khớp với form nhập liệu Logistics ---
  @Column()
  name: string; // VD: Bao bì, Vận chuyển, Khấu hao...
  // ----------------------------------------------------------------

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  cost: number; // Chi phí tính cho 1 đơn vị sản phẩm

  @Column({ nullable: true })
  note: string;
}