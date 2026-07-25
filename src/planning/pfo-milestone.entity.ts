import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ProductionFulfillmentOrder } from './pfo.entity';

export enum PfoMilestoneType {
  MATERIAL_RECEIVED = 'MATERIAL_RECEIVED',
  CUTTING_STARTED = 'CUTTING_STARTED',
  CUTTING_COMPLETED = 'CUTTING_COMPLETED',
  SEWING_STARTED = 'SEWING_STARTED',
  SEWING_COMPLETED = 'SEWING_COMPLETED',
  ASSEMBLY_STARTED = 'ASSEMBLY_STARTED',
  PRODUCTION_COMPLETED = 'PRODUCTION_COMPLETED',
  INTERNAL_QC_COMPLETED = 'INTERNAL_QC_COMPLETED',
  READY_FOR_DISPATCH = 'READY_FOR_DISPATCH'
}

export enum MilestoneStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DELAYED = 'DELAYED'
}

@Entity('pfo_milestones')
export class PfoMilestone {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ProductionFulfillmentOrder, (pfo) => pfo.milestones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pfo_id' })
  pfo: ProductionFulfillmentOrder;

  @Column()
  pfo_id: number;

  @Column({
    type: 'enum',
    enum: PfoMilestoneType
  })
  milestone_type: PfoMilestoneType;

  @Column({ type: 'date', nullable: true })
  planned_date: Date;

  @Column({ type: 'date', nullable: true })
  actual_date: Date;

  @Column({
    type: 'enum',
    enum: MilestoneStatus,
    default: MilestoneStatus.PENDING
  })
  status: MilestoneStatus;

  @Column('float', { default: 0 })
  planned_quantity: number;

  @Column('float', { default: 0 })
  completed_quantity: number;

  @Column('float', { default: 0 })
  rejected_quantity: number;

  @Column('text', { nullable: true })
  evidence_photo_url: string;

  @Column('text', { nullable: true })
  note: string;

  @Column({ nullable: true })
  updated_by_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
