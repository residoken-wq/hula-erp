import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('product_components')
export class ProductComponent {
  @PrimaryGeneratedColumn()
  id: number;

  // San pham Cha (Combo)
  @ManyToOne(() => Product, (product) => product.id)
  @JoinColumn({ name: 'parent_product_id' })
  parent_product: Product;

  // San pham Con (Thanh phan)
  @ManyToOne(() => Product, (product) => product.id)
  @JoinColumn({ name: 'child_product_id' })
  child_product: Product;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number; // So luong con trong 1 combo
}
