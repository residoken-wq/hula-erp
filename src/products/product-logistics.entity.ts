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

  @Column()
  route_name: string; // VD: Kho Vai -> Xuong Chan Gon

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  cost: number; // Chi phi uoc tinh (VD: 150k/chuyen -> Chia dau san pham = 500d)

  @Column({ nullable: true })
  note: string;
}
