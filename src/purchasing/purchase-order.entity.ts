import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany, ManyToOne, JoinColumn, UpdateDateColumn, Generated } from 'typeorm';
import { PurchaseOrderItem } from './purchase-order-item.entity';
import { Supplier } from '../suppliers/supplier.entity';
import { ProductionPlan } from '../planning/production-plan.entity';

export enum POStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',             // Đã gửi NCC
  CONFIRMED = 'CONFIRMED',   // NCC xác nhận
  PARTIAL_RECEIVED = 'PARTIAL_RECEIVED',
  RECEIVED = 'RECEIVED',     // Đã nhập kho đủ
  COMPLETED = 'COMPLETED',   // Đã thanh toán xong
  CANCELLED = 'CANCELLED'
}

export enum POType {
  MATERIAL = 'MATERIAL',       // Mua nguyên liệu
  OUTSOURCING = 'OUTSOURCING'  // Thuê gia công
}

@Entity('purchase_orders')
export class PurchaseOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Generated("uuid")
  uuid: string; // Link Portal

  @Column({ unique: true })
  po_code: string; 

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ nullable: true })
  supplier_id: number;

  @Column({
      type: 'enum',
      enum: POType,
      default: POType.MATERIAL
  })
  type: POType;

  // --- LINK PLANNING ---
  @ManyToOne(() => ProductionPlan, { nullable: true })
  @JoinColumn({ name: 'plan_id' })
  production_plan: ProductionPlan;

  @Column({ nullable: true })
  plan_id: number;

  // --- FINANCIALS & LOGISTICS ---
  @Column('decimal', { precision: 15, scale: 2, default: 0 }) total_amount: number;
  @Column('decimal', { precision: 15, scale: 2, default: 0 }) paid_amount: number;
  @Column('decimal', { default: 0 }) shipping_fee: number;
  @Column('int', { default: 0 }) vat_rate: number; // %

  @Column({ type: 'date', nullable: true }) expected_delivery_date: Date;
  @Column({ nullable: true }) delivery_address: string;
  @Column({ nullable: true }) payment_term: string; // VD: Cong no 30 ngay
  @Column('text', { nullable: true }) note: string;

  @Column({ type: 'enum', enum: POStatus, default: POStatus.DRAFT })
  status: POStatus;

  @OneToMany(() => PurchaseOrderItem, (item) => item.po, { cascade: true })
  items: PurchaseOrderItem[];

  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}