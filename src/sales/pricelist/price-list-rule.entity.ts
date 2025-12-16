import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
// Import class cha từ file khác (Lưu ý đường dẫn ./price-list.entity)
import { PriceList } from './price-list.entity';

@Entity('price_list_rules')
export class PriceListRule {
  @PrimaryGeneratedColumn()
  id: number;

  // Mối quan hệ n-1: Trỏ ngược về PriceList
  @ManyToOne(() => PriceList, (list) => list.rules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'price_list_id' })
  price_list: PriceList;

  @Column()
  price_list_id: number;

  @Column()
  product_sku: string;

  // --- CÁC GIỚI HẠN ---
  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  min_price: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  max_price: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  min_margin: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  max_margin: number;
}