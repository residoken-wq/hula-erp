import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity'; // Import cùng thư mục

@Entity('goods_receipts')
export class GoodsReceipt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  code: string;

  @ManyToOne(() => PurchaseOrder)
  @JoinColumn({ name: 'po_id' })
  purchase_order: PurchaseOrder;

  @Column({ type: 'date', nullable: true })
  received_date: string;

  @Column({ nullable: true })
  note: string;

  @CreateDateColumn() created_at: Date;
}