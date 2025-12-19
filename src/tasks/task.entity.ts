import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/entities/user.entity';

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
      type: 'enum',
      enum: TaskStatus,
      default: TaskStatus.TODO
  })
  status: TaskStatus;

  @Column({
      type: 'enum',
      enum: TaskPriority,
      default: TaskPriority.MEDIUM
  })
  priority: TaskPriority;

  @Column({ type: 'timestamp', nullable: true })
  due_date: Date;

  @Column({ default: false })
  is_reminded: boolean; // Đánh dấu đã nhắc nhở chưa

  // Người được giao việc
  @ManyToOne(() => User)
  @JoinColumn({ name: 'assignee_id' })
  assignee: User;

  @Column({ nullable: true })
  assignee_id: number;

  // Người tạo
  @ManyToOne(() => User)
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @Column({ nullable: true })
  creator_id: number;

  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}