import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany, UpdateDateColumn } from 'typeorm';
import { SupplierMaterial } from './supplier-material.entity';
import { SupplierContact } from './supplier-contact.entity';

export enum SupplierType {
  MATERIAL = 'MATERIAL',       // Chi ban NPL
  PROCESSING = 'PROCESSING',   // Chi gia cong (Cat, May, Chan)
  MIX = 'MIX'                  // Ca hai
}

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: SupplierType,
    default: SupplierType.MATERIAL
  })
  type: SupplierType;

  @Column({ nullable: true })
  tax_code: string;

  @Column({ nullable: true })
  legal_name: string;

  @Column({ nullable: true })
  vat_address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  address: string;

  @OneToMany(() => SupplierContact, (c) => c.supplier, { cascade: true })
  contacts: SupplierContact[];

  @OneToMany(() => SupplierMaterial, (sm) => sm.supplier)
  price_list: SupplierMaterial[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}