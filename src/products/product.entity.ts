import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  sku: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  category: string; 

  @Column({ nullable: true })
  product_type: string;

  // --- QUAN LY BIEN THE (JSON) ---
  // Luu: { "color": "Xanh", "size": "120x60", "fabric": "Cara" }
  @Column('jsonb', { nullable: true })
  attributes: any;
  // ------------------------------

  @Column({ nullable: true })
  unit: string; 

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  base_price: number; 

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  cost_price: number; 

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  quantity_in_stock: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
