import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Category } from '../categories/category.entity';
import { ProductRouting } from './product-routing.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  sku: string;

  @Column()
  name: string;

  @ManyToOne(() => Category, (cat) => cat.products, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category_link: Category;

  @Column({ nullable: true })
  category_id: number;

  @Column({ nullable: true })
  category: string; 

  @Column({ nullable: true })
  product_type: string;

  @Column('jsonb', { nullable: true })
  attributes: any;

  @Column({ nullable: true })
  unit: string; 

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  base_price: number; 

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  cost_price: number; 

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  profit_margin: number; 

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  quantity_in_stock: number;

  @Column({ default: true })
  is_active: boolean;
  
  // --- MỚI: FIELD MÔ TẢ KHÁCH HÀNG ---
  @Column('text', { nullable: true })
  customer_description: string;

  // --- MỚI: FIELD MÔ TẢ GIA CÔNG ---
  @Column('text', { nullable: true })
  processing_description: string;
  
  @OneToMany(() => ProductRouting, (routing) => routing.product)
  routings: ProductRouting[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}