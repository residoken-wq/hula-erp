import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TransactionCategory } from './transaction-category.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: string;

  @Column()
  type: 'INCOME' | 'EXPENSE';

  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;

  @ManyToOne(() => TransactionCategory, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: TransactionCategory;

  @Column({ nullable: true })
  category_id: number;

  @Column({ nullable: true })
  description: string;

  // --- LIÊN KẾT TỰ ĐỘNG (Auto ref) ---
  @Column({ nullable: true })
  reference_code: string; // Mã đơn hàng (nếu có)

  @Column({ nullable: true })
  reference_type: string; // SALES_ORDER, PURCHASE_ORDER, etc.

  @CreateDateColumn()
  created_at: Date;
}