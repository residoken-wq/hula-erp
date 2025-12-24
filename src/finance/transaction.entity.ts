import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TransactionCategory } from './transaction-category.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: string; // Ngày ghi nhận giao dịch

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

  @Column({ nullable: true })
  partner_name: string; // Khách hàng hoặc Nhà cung cấp

  // --- LIÊN KẾT TỰ ĐỘNG ---
  @Column({ nullable: true })
  reference_code: string; // Mã đơn hàng (PO-..., SO-...)

  @Column({ nullable: true })
  reference_type: string; // SALES, PURCHASE

  // --- MỚI: THÔNG TIN HÓA ĐƠN VAT ---
  @Column({ nullable: true })
  vat_invoice_code: string; // Số hóa đơn VAT

  @Column({ nullable: true })
  vat_invoice_url: string; // Link ảnh/file hóa đơn
  // ---------------------------------

  @CreateDateColumn()
  created_at: Date;
}