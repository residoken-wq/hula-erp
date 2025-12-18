import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity'; // Cùng thư mục
import { Material } from '../../materials/material.entity'; // Lùi 2 cấp
import { Product } from '../../products/product.entity';   // Lùi 2 cấp

@Entity('purchase_order_items')
export class PurchaseOrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PurchaseOrder, (po) => po.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'po_id' })
  po: PurchaseOrder;

  // --- QUAN HỆ VỚI NGUYÊN LIỆU (NẾU PO LÀ MATERIAL) ---
  @ManyToOne(() => Material, { nullable: true })
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @Column({ nullable: true })
  material_id: number;

  // --- QUAN HỆ VỚI SẢN PHẨM (NẾU PO LÀ OUTSOURCING) ---
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