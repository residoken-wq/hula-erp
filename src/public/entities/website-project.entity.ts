import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('website_projects')
export class WebsiteProject {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({ unique: true })
    slug: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ nullable: true })
    school_name: string;

    @Column({ nullable: true })
    location: string;

    // Store image URLs as JSON array
    @Column('simple-json', { nullable: true, default: '[]' })
    images: string[];

    @Column({ default: false })
    featured: boolean;

    @Column({ default: true })
    is_active: boolean;

    @Column({ default: 0 })
    sort_order: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
