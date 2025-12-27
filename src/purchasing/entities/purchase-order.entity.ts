import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { PurchaseOrderItem } from './purchase-order-item.entity';
import { ProductionPlan } from '../../planning/production-plan.entity';
import { Supplier } from '../../suppliers/supplier.entity';

export enum POStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  CONFIRMED = 'CONFIRMED',
  ORDERED = 'ORDERED', // Mới
  DELIVERED = 'DELIVERED', // Đã giao đủ
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum POType {
  MATERIAL = 'MATERIAL',
  OUTSOURCING = 'OUTSOURCING'
}

@Entity('purchase_orders')
export class PurchaseOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  po_code: string;

  @Column({ generated: 'uuid' })
  uuid: string;

  @Column({
    type: 'enum',
    enum: POStatus,
    default: POStatus.DRAFT
  })
  status: POStatus;

  @Column({
    type: 'enum',
    enum: POType,
    default: POType.MATERIAL
  })
  type: POType;



  @ManyToOne(() => Supplier, { nullable: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ nullable: true })
  supplier_id: number;

  @ManyToOne(() => ProductionPlan, { nullable: true })
  @JoinColumn({ name: 'plan_id' })
  plan: ProductionPlan;

  @Column({ nullable: true })
  plan_id: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  total_amount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  paid_amount: number;

  @Column({ nullable: true })
  note: string;

  // --- MỚI: Thông tin vận chuyển NPL sang Gia công ---
  // Lưu dạng JSON: { sent_date: '...', vehicle: '...', status: 'SENT/RECEIVED', note: '...' }
  @Column({ type: 'jsonb', nullable: true })
  outsourcing_delivery_info: any;

  @Column({ type: 'jsonb', nullable: true })
  delivery_info: any;

  // --- MỚI: Chi tiết Đóng gói (Tab 3 - Dạng Matrix) ---
  @Column({ type: 'jsonb', nullable: true })
  packing_list_details: any[]; // Array of rows
  // --------------------------------------------------
  // --------------------------------------------------

  @OneToMany(() => PurchaseOrderItem, (item) => item.purchase_order, { cascade: true })
  items: PurchaseOrderItem[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}