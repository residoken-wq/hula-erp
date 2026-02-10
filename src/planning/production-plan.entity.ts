import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { SalesOrder } from '../sales/sales-order.entity';

export enum PlanStatus {
  DRAFT = 'DRAFT',           // Mới tạo
  CALCULATED = 'CALCULATED', // Đã chạy MRP (Tính toán vật tư)
  COMPLETED = 'COMPLETED'    // Đã hoàn thành SX
}

@Entity('production_plans')
export class ProductionPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string; // Mã Kế hoạch (VD: KH_T12_01)

  @Column()
  name: string; // Tên đợt (VD: Đợt 1 tháng 12)

  @Column({
    type: 'enum',
    enum: PlanStatus,
    default: PlanStatus.DRAFT
  })
  status: PlanStatus;

  @Column({ type: 'date', nullable: true })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({ type: 'simple-json', nullable: true })
  mrp_data: any;

  @Column({ type: 'simple-json', nullable: true })
  mrp_result: any;

  @Column({ type: 'simple-json', nullable: true })
  outsourcing_data: any;

  @Column({ type: 'simple-json', nullable: true })
  logistics_data: any;

  @Column({ type: 'simple-json', nullable: true })
  outsourcing_result: any;

  @Column({ type: 'simple-json', nullable: true })
  gantt_config: any; // { [sku]: { steps: [{step_name, start, end}], step_order: [...] } }

  @OneToMany(() => SalesOrder, (so) => so.production_plan)
  sales_orders: SalesOrder[];

  @CreateDateColumn()
  created_at: Date;
}
