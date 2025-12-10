import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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

  // --- MOI THEM: QUY DOI ---
  @Column({ nullable: true })
  purchase_unit: string; // Don vi mua (VD: Tam, Cuon, Cay)

  @Column('decimal', { precision: 10, scale: 4, default: 1 })
  conversion_factor: number; // He so: 1 Don vi mua = ??? Don vi co ban
  // Vi du: Mua Tam, Ton Met. 1 Tam = 2.4m -> Factor = 2.4
  // -------------------------

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  cost_per_unit: number; // Gia von (Theo Don vi co ban)

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  quantity_in_stock: number; // So luong (Theo Don vi co ban)

  @Column({ nullable: true })
  supplier_name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
