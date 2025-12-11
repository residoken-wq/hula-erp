import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('processes')
export class Process {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string; // VD: P_MAY, P_CAT

  @Column()
  name: string; // VD: Gia công May

  @Column({ default: 'Cái' })
  unit: string; // ĐVT (Cái, Giờ, Mét)

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  standard_cost: number; // Giá định mức tham khảo

  @CreateDateColumn()
  created_at: Date;
}