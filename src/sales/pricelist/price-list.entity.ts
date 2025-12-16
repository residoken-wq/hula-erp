import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
// Import class con từ file khác (Lưu ý đường dẫn ./price-list-rule.entity)
import { PriceListRule } from './price-list-rule.entity';

@Entity('price_lists')
export class PriceList {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // Tên bảng giá

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  user_id: number; // Áp dụng cho Sale nào

  @Column({ type: 'date' })
  valid_from: Date;

  @Column({ type: 'date' })
  valid_to: Date;

  @Column({ default: true })
  is_active: boolean;

  // Mối quan hệ 1-n: Trỏ tới PriceListRule
  @OneToMany(() => PriceListRule, (rule) => rule.price_list, { cascade: true })
  rules: PriceListRule[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}