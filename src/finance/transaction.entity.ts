import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum TransactionType {
  INCOME = 'INCOME',   // Thu tien (Ban hang)
  EXPENSE = 'EXPENSE'  // Chi tien (Mua hang, Tra luong...)
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: TransactionType
  })
  type: TransactionType;

  @Column('decimal', { precision: 15, scale: 2 })
  amount: number; // So tien

  @Column()
  reference_code: string; // Ma don hang (SO_... hoac PO_...)

  @Column({ nullable: true })
  description: string; // Noi dung: Khach A dat coc, Tra tien mua vai...

  @Column({ default: 'CASH' })
  payment_method: string; // CASH, BANK_TRANSFER

  @CreateDateColumn()
  created_at: Date;
}
