import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Supplier } from './supplier.entity';

@Entity('supplier_contacts')
export class SupplierContact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  full_name: string; // Ten nguoi lien he

  @Column({ nullable: true })
  job_title: string; // Chuc danh: Sale Admin, Giam doc...

  @Column({ nullable: true })
  phone_number: string; // So di dong

  @Column({ nullable: true })
  email: string;

  @ManyToOne(() => Supplier, (s) => s.contacts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;
}
