import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('stock_history')
export class StockHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: 'IMPORT' | 'EXPORT'; // Nhap hoac Xuat

  @Column()
  item_type: 'PRODUCT' | 'MATERIAL'; // Hang hoa hay Nguyen lieu

  @Column()
  item_id: number; // ID cua SP hoac NL

  @Column({ nullable: true })
  item_code: string; // Luu them SKU/Code de de tra cuu

  @Column('decimal', { precision: 15, scale: 2 })
  quantity: number; // So luong bien dong

  @Column('decimal', { precision: 15, scale: 2 })
  balance_after: number; // Ton kho sau khi giao dich

  @Column({ nullable: true })
  reference_code: string; // Ma SO (Sales Order) hoac PO (Purchase Order)

  @Column({ nullable: true })
  note: string;

  @CreateDateColumn()
  created_at: Date;
}
