import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { WorkOrder } from './work-order.entity';

@Entity('work_order_steps')
export class WorkOrderStep {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => WorkOrder, (wo) => wo.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'work_order_id' })
  work_order: WorkOrder;

  @Column()
  step_name: string; // VD: Nối vải, Chần gòn

  @Column('int')
  order_index: number; // Thứ tự: 1, 2, 3...

  @Column({ default: 'PENDING' }) 
  status: string; // PENDING, IN_PROGRESS, COMPLETED

  @Column({ nullable: true })
  assigned_to: string; // Tên tổ đội / Nhà gia công
}


