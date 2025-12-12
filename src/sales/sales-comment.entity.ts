import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SalesOrder } from './sales-order.entity';

@Entity('sales_comments')
export class SalesComment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => SalesOrder, (order) => order.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: SalesOrder;

  @Column()
  sender_type: 'STAFF' | 'CUSTOMER'; 

  @Column({ nullable: true })
  sender_name: string;

  @Column('text')
  content: string;

  @Column({ default: true })
  is_visible: boolean;

  @CreateDateColumn()
  created_at: Date;
}