import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { Product } from '../product.entity';

@Entity('product_website_config')
export class ProductWebsiteConfig {
    @PrimaryColumn()
    product_id: number;

    @OneToOne(() => Product)
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column('jsonb', { nullable: true })
    customization_config: {
        allow_logo: boolean;
        logo_price?: number;
        logo_position?: { x: number; y: number; width: number; height: number };
        base_image?: string; // Frame/Matress base
        pillow_image?: string; // Pillow default
        colors: Array<{ name: string; code: string; image_url?: string; pillow_image_url?: string }>;
        accessories: Array<{ name: string; price: number; image_url?: string }>;
    };
}
