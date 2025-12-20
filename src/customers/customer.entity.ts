import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { SalesOrder } from '../sales/sales-order.entity';
import { CustomerContact } from './customer-contact.entity';

export enum CustomerType {
  LEAD = 'LEAD',
  CUSTOMER = 'CUSTOMER'
}

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: CustomerType,
    default: CustomerType.LEAD
  })
  type: CustomerType;

  // --- CRM FIELDS ---
  @Column({ nullable: true })
  lead_status: string; // NEW, CONTACTED, QUALIFIED, NEGOTIATION, WON, LOST

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  potential_value: number;
  // ------------------

  // --- QUAN HỆ KHÁCH HÀNG (CHA - CON) ---
  @ManyToOne(() => Customer, (customer) => customer.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Customer; // Công ty mẹ / Trụ sở chính

  @Column({ nullable: true })
  parent_id: number;

  @OneToMany(() => Customer, (customer) => customer.parent)
  children: Customer[]; // Các chi nhánh / Công ty con
  // -------------------------------------

  // --- DANH SÁCH LIÊN HỆ ---
  @OneToMany(() => CustomerContact, (contact) => contact.customer, { cascade: true })
  contacts: CustomerContact[];
  // -------------------------

  @Column('jsonb', { nullable: true, default: [] })
  history: any;

  @Column({ nullable: true })
  tax_code: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  address: string;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  credit_limit: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  current_debt: number;

  @OneToMany(() => SalesOrder, (order) => order.customer)
  orders: SalesOrder[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}