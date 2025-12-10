import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';
import { Supplier } from '../suppliers/supplier.entity';

@Entity('product_routings')
export class ProductRouting {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: number;

  @Column()
  step_name: string; // Noi Vai, Chan Gon, May, Dong Goi

  @Column({ default: false })
  is_required: boolean; // Co bat buoc khong? (Vd: Noi vai co the khong can)

  // Nha Gia Cong
  @ManyToOne(() => Supplier, { nullable: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ nullable: true })
  supplier_id: number;

  // Don gia gia cong (Vd: 5000d / cai)
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  cost: number;

  @Column({ nullable: true })
  note: string;
}
