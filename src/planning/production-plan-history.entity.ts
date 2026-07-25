import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ProductionPlan } from './production-plan.entity';

@Entity('production_plan_history')
export class ProductionPlanHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ProductionPlan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' })
  plan: ProductionPlan;

  @Column()
  plan_id: number;

  @Column('int')
  version: number;

  @Column({ type: 'simple-json', nullable: true })
  changes_summary: any; // { type: 'BOM_CHANGE' | 'ROUTING_CHANGE' | 'MRP_SAVE', description: string, details: any }

  @Column({ type: 'simple-json', nullable: true })
  snapshot_data: any; // The full state of mrp_data, outsourcing_data, logistics_data, gantt_config at this version

  @Column({ nullable: true })
  created_by: string;

  @CreateDateColumn()
  created_at: Date;
}
