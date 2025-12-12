import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
// Import Entity bảng giá
import { SupplierMaterial } from '../suppliers/supplier-material.entity';

@Entity('materials')
export class Material {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  material_type: string;

  // --- DON VI TINH CO BAN (Base Unit) ---
  // Dung de tinh ton kho va BOM (VD: met, kg)
  @Column()
  unit: string; 

  // --- QUY DOI (GIỮ NGUYÊN) ---
  @Column({ nullable: true })
  purchase_unit: string; // Don vi mua (VD: Tam, Cuon, Cay)

  @Column('decimal', { precision: 10, scale: 4, default: 1 })
  conversion_factor: number; 
  // -------------------------

  // Giá cũ của bạn (Giữ nguyên để không mất data)
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  cost_per_unit: number; 

  // --- MỚI: GIÁ VỐN TÍNH BOM (Auto update từ NCC mặc định) ---
  // Thêm cột này để khớp với code trong SuppliersService
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  cost_price: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  quantity_in_stock: number; // So luong (Theo Don vi co ban)

  @Column({ nullable: true })
  supplier_name: string;

  // --- MỚI: QUAN HỆ VỚI BẢNG GIÁ NCC ---
  @OneToMany(() => SupplierMaterial, (sm) => sm.material)
  supplier_prices: SupplierMaterial[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}