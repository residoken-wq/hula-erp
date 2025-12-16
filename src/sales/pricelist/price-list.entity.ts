import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PriceList } from './price-list.entity';

@Entity('price_list_rules')
export class PriceListRule {
  @PrimaryGeneratedColumn()
  id: number;

  // Liên kết ngược lại bảng giá cha
  @ManyToOne(() => PriceList, (list) => list.rules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'price_list_id' })
  price_list: PriceList;

  @Column()
  price_list_id: number;

  @Column()
  product_sku: string; // SKU sản phẩm được áp dụng luật này

  // --- CÁC GIỚI HẠN GIÁ ---

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  min_price: number; // Giá bán tối thiểu (VND)

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  max_price: number; // Giá bán tối đa (VND) - Nếu muốn giới hạn trần

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  min_margin: number; // Lợi nhuận tối thiểu (%) - VD: 10%

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  max_margin: number; // Lợi nhuận tối đa (%)
}