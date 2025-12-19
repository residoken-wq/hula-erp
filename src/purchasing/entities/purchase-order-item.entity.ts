import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity'; 
import { Material } from '../../materials/material.entity'; 
import { Product } from '../../products/product.entity';   

@Entity('purchase_order_items')
export class PurchaseOrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  // --- FIX: Đổi tên 'po' -> 'purchase_order' để khớp với PurchaseOrder entity ---
  @ManyToOne(() => PurchaseOrder, (po) => po.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'po_id' })
  purchase_order: PurchaseOrder;
  // -----------------------------------------------------------------------------

  @ManyToOne(() => Material, { nullable: true })
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @Column({ nullable: true })
  material_id: number;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ nullable: true })
  product_id: number;

  @Column({ nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;

  @Column('decimal', { precision: 15, scale: 2 })
  unit_price: number;

  @Column('decimal', { precision: 15, scale: 2 })
  subtotal: number;
}