import { Entity, Column, PrimaryColumn, UpdateDateColumn, CreateDateColumn } from 'typeorm';

export interface WizardProduct {
    product_id: number;
    sku: string;
    name: string;
    price: number;
    image_url?: string;
    description?: string;
    icon?: string;
}

export interface WizardService {
    id: string;
    name: string;
    price: number;
    note?: string;
    icon?: string;
}

export interface WizardConfigData {
    main: WizardProduct[];      // Sản phẩm chính: nệm, gối, chăn
    accessory: WizardProduct[]; // Phụ kiện: túi, balo, tạp dề
    service: WizardService[];   // Dịch vụ: thêu, in
}

@Entity('wizard_config')
export class WizardConfig {
    @PrimaryColumn()
    key: string; // 'wizard_products'

    @Column('jsonb', { default: {} })
    value: WizardConfigData;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
