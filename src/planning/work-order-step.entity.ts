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
EOF

# 2. Cập nhật WorkOrder (Thêm quan hệ Steps)
cat << 'EOF' > src/production/work-order.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { WorkOrderStep } from './work-order-step.entity';

export enum WorkOrderStatus {
  PENDING = 'PENDING',       
  IN_PROGRESS = 'IN_PROGRESS', 
  COMPLETED = 'COMPLETED',   
  CANCELLED = 'CANCELLED'    
}

@Entity('work_orders')
export class WorkOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string; 

  @Column()
  product_sku: string; 

  @Column('int')
  quantity: number; 

  @Column({
    type: 'enum',
    enum: WorkOrderStatus,
    default: WorkOrderStatus.PENDING
  })
  status: WorkOrderStatus;

  // --- QUẢN LÝ TIẾN ĐỘ CHI TIẾT ---
  @OneToMany(() => WorkOrderStep, (step) => step.work_order, { cascade: true })
  steps: WorkOrderStep[];
  // -------------------------------

  @Column({ nullable: true })
  note: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}