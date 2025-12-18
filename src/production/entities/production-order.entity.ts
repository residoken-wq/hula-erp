import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Product } from '../../products/product.entity';

@Entity('production_orders')
export class ProductionOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: number;

  @Column('decimal', { precision: 15, scale: 2 })
  quantity: number;

  @Column({ type: 'date' })
  start_date: string;

  @Column({ type: 'date' })
  due_date: string;

  @Column({ default: 'PLANNED' }) // PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
  status: string;

  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}