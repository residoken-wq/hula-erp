import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';

@Entity('purchase_order_items')
export class PurchaseOrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PurchaseOrder, (po) => po.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'po_id' })
  purchaseOrder: PurchaseOrder;

  @Column()
  material_code: string; // Ma nguyen lieu (Link voi bang Materials)

  @Column('decimal', { precision: 15, scale: 2 })
  quantity: number;

  @Column('decimal', { precision: 15, scale: 2 })
  unit_price: number; // Gia nhap tai thoi diem mua

  @Column('decimal', { precision: 15, scale: 2 })
  subtotal: number;
}
