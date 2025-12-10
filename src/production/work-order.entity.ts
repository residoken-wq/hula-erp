import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum WorkOrderStatus {
  PENDING = 'PENDING',       // Moi tao, chua lam
  IN_PROGRESS = 'IN_PROGRESS', // Dang san xuat
  COMPLETED = 'COMPLETED',   // Da xong (Da tru kho NL, cong kho SP)
  CANCELLED = 'CANCELLED'    // Huy
}

@Entity('work_orders')
export class WorkOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string; // Ma Lenh SX: WO_2025_001

  @Column()
  product_sku: string; // San xuat san pham nao

  @Column('int')
  quantity: number; // So luong can san xuat

  @Column({
    type: 'enum',
    enum: WorkOrderStatus,
    default: WorkOrderStatus.PENDING
  })
  status: WorkOrderStatus;

  @Column({ nullable: true })
  note: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
