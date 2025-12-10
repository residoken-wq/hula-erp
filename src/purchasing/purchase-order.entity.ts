import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { PurchaseOrderItem } from './purchase-order-item.entity';

export enum POStatus {
  DRAFT = 'DRAFT',       
  ORDERED = 'ORDERED',   
  RECEIVED = 'RECEIVED', 
  CANCELLED = 'CANCELLED'
}

@Entity('purchase_orders')
export class PurchaseOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string; 

  @Column()
  supplier_name: string; 

  @Column({
    type: 'enum',
    enum: POStatus,
    default: POStatus.DRAFT
  })
  status: POStatus;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  total_amount: number; 

  // --- MOI THEM: So tien minh da tra ---
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  paid_amount: number;
  // ------------------------------------

  @OneToMany(() => PurchaseOrderItem, (item) => item.purchaseOrder, { cascade: true })
  items: PurchaseOrderItem[];

  @CreateDateColumn()
  created_at: Date;
}
