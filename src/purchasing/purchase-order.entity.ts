import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany, ManyToOne, JoinColumn, UpdateDateColumn, Generated } from 'typeorm';
import { PurchaseOrderItem } from './purchase-order-item.entity';
import { Supplier } from '../../suppliers/supplier.entity';
// import { ProductionPlan } from '../../planning/production-plan.entity'; // Bỏ comment nếu đã có file này

export enum POStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  CONFIRMED = 'CONFIRMED',
  PARTIAL_RECEIVED = 'PARTIAL_RECEIVED',
  RECEIVED = 'RECEIVED',
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

  @Column()
  @Generated("uuid")
  uuid: string;

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

  // @ManyToOne(() => ProductionPlan, { nullable: true })
  // @JoinColumn({ name: 'plan_id' })
  // production_plan: ProductionPlan;

  @Column({ nullable: true })
  plan_id: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 }) total_amount: number;
  @Column('decimal', { precision: 15, scale: 2, default: 0 }) paid_amount: number;
  @Column('decimal', { default: 0 }) shipping_fee: number;
  @Column('int', { default: 0 }) vat_rate: number;

  @Column({ type: 'date', nullable: true }) expected_delivery_date: Date;
  @Column({ nullable: true }) delivery_address: string;
  @Column({ nullable: true }) payment_term: string;
  @Column('text', { nullable: true }) note: string;

  @Column({ type: 'enum', enum: POStatus, default: POStatus.DRAFT })
  status: POStatus;

  // Quan hệ 1-N với Items
  @OneToMany(() => PurchaseOrderItem, (item) => item.po, { cascade: true })
  items: PurchaseOrderItem[];

  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}