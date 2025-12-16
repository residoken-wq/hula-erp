import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { PriceListRule } from './price-list-rule.entity';

@Entity('price_lists')
export class PriceList {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // Tên bảng giá (VD: Bảng giá Q1-2024 - Sale Team A)

  @Column({ nullable: true })
  description: string;

  // Áp dụng cho User Sale cụ thể (Theo yêu cầu của bạn)
  @Column({ nullable: true })
  user_id: number; 

  @Column({ type: 'date' })
  valid_from: Date; // Ngày bắt đầu áp dụng

  @Column({ type: 'date' })
  valid_to: Date; // Ngày kết thúc áp dụng

  @Column({ default: true })
  is_active: boolean;

  // Mối quan hệ 1-n: Một bảng giá có nhiều quy tắc (rules) cho từng sản phẩm
  @OneToMany(() => PriceListRule, (rule) => rule.price_list, { cascade: true })
  rules: PriceListRule[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}