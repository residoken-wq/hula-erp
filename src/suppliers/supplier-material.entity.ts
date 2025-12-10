import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Supplier } from './supplier.entity';
import { Material } from '../materials/material.entity';

@Entity('supplier_materials')
export class SupplierMaterial {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Supplier, (s) => s.price_list, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column()
  supplier_id: number;

  @ManyToOne(() => Material, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @Column()
  material_id: number;

  @Column('decimal', { precision: 15, scale: 2 })
  price: number;

  @Column({ default: 'VND' })
  currency: string;

  @Column({ default: false })
  is_preferred: boolean;

  // --- THOI HAN BANG GIA ---
  @Column({ type: 'date', nullable: true })
  valid_from: Date;

  @Column({ type: 'date', nullable: true })
  valid_to: Date;
  // -----------------------

  @CreateDateColumn()
  updated_at: Date;
}
