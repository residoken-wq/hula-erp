import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany, UpdateDateColumn } from 'typeorm';
import { SupplierMaterial } from './supplier-material.entity';
import { SupplierContact } from './supplier-contact.entity';
import { ProductRouting } from '../products/product-routing.entity'; // Import

export enum SupplierType {
  MATERIAL = 'MATERIAL',
  PROCESSING = 'PROCESSING',
  MIX = 'MIX'
}

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column('decimal', { default: 0 })
  debt: number;

  @Column({ type: 'enum', enum: SupplierType, default: SupplierType.MATERIAL })
  type: SupplierType;

  @Column({ nullable: true }) tax_code: string;
  @Column({ nullable: true }) legal_name: string;
  @Column({ nullable: true }) vat_address: string;
  @Column({ nullable: true }) phone: string;
  @Column({ nullable: true }) email: string;
  @Column({ nullable: true }) address: string;
  @Column('text', { nullable: true }) note: string;

  @OneToMany(() => SupplierContact, (c) => c.supplier, { cascade: true })
  contacts: SupplierContact[];

  @OneToMany(() => SupplierMaterial, (sm) => sm.supplier)
  price_list: SupplierMaterial[];

  // --- FIX: THÊM DÒNG NÀY ĐỂ HẾT LỖI CRASH ---
  @OneToMany(() => ProductRouting, (routing) => routing.supplier)
  routings: ProductRouting[];

  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}