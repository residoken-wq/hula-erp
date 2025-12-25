import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany, CreateDateColumn } from 'typeorm';
import { SalesOrder } from './sales-order.entity';
import { SalesDeliveryItem } from './sales-delivery-item.entity';

@Entity('sales_deliveries')
export class SalesDelivery {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string; // VD: DO-251210-001 (Delivery Order)

  @ManyToOne(() => SalesOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  sales_order: SalesOrder;

  @Column()
  order_id: number;

  @Column({ type: 'date' })
  delivery_date: Date;

  @Column({ nullable: true })
  note: string;

  @Column({ nullable: true })
  delivery_address: string;

  @Column({ nullable: true })
  contact_name: string;

  @Column({ nullable: true })
  contact_phone: string;

  @OneToMany(() => SalesDeliveryItem, (item) => item.delivery, { cascade: true })
  items: SalesDeliveryItem[];

  @CreateDateColumn()
  created_at: Date;
}