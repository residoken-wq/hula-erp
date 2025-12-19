import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { PurchaseOrderItem } from './purchase-order-item.entity';
import { ProductionPlan } from '../../planning/production-plan.entity';
import { Supplier } from '../../suppliers/supplier.entity'; // <--- Import Supplier

export enum POStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',           // Đã gửi NCC
  CONFIRMED = 'CONFIRMED', // NCC Xác nhận
  COMPLETED = 'COMPLETED', // Đã nhập kho đủ
  CANCELLED = 'CANCELLED'
}

export enum POType {
  MATERIAL = 'MATERIAL',       // Đơn mua nguyên liệu
  OUTSOURCING = 'OUTSOURCING'  // Đơn đặt hàng gia công
}

@Entity('purchase_orders')
export class PurchaseOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  po_code: string; 

  // UUID dùng cho Portal NCC
  @Column({ generated: 'uuid' })
  uuid: string;

  @Column({
    type: 'enum',
    enum: POType,
    default: POType.MATERIAL
  })
  type: POType;

  @Column({
    type: 'enum',
    enum: POStatus,
    default: POStatus.DRAFT
  })
  status: POStatus;

  // --- QUAN HỆ NHÀ CUNG CẤP (MỚI) ---
  @ManyToOne(() => Supplier, { nullable: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ nullable: true })
  supplier_id: number;
  // ----------------------------------

  @ManyToOne(() => ProductionPlan, { nullable: true })
  @JoinColumn({ name: 'plan_id' })
  plan: ProductionPlan;

  @Column({ nullable: true })
  plan_id: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  total_amount: number;

  // --- QUẢN LÝ THANH TOÁN (MỚI) ---
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  paid_amount: number;
  // --------------------------------

  @Column({ nullable: true })
  note: string;

  @OneToMany(() => PurchaseOrderItem, (item) => item.purchase_order, { cascade: true })
  items: PurchaseOrderItem[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}