import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { SalesOrder } from '../sales/sales-order.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string; // Mã KH (VD: KH001)

  @Column()
  name: string;

  @Column({ nullable: true })
  tax_code: string; // MST

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  address: string;

  // --- QUẢN TRỊ RỦI RO TÍN DỤNG ---
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  credit_limit: number; // Hạn mức cho phép nợ tối đa

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  current_debt: number; // Nợ hiện tại
  // -------------------------------

  @OneToMany(() => SalesOrder, (order) => order.customer)
  orders: SalesOrder[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}