import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/entities/user.entity';

export enum BlogStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    ARCHIVED = 'ARCHIVED'
}

@Entity('blog_posts')
export class BlogPost {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    slug: string;

    @Column()
    title: string;

    @Column('text', { nullable: true })
    excerpt: string;

    @Column('text')
    content: string;

    @Column({ nullable: true })
    featured_image: string;

    @Column({ nullable: true })
    category: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'author_id' })
    author: User;

    @Column({ nullable: true })
    author_id: number;

    @Column({
        type: 'enum',
        enum: BlogStatus,
        default: BlogStatus.DRAFT
    })
    status: BlogStatus;

    @Column({ type: 'timestamp', nullable: true })
    published_at: Date;

    // SEO Fields
    @Column({ nullable: true })
    meta_title: string;

    @Column('text', { nullable: true })
    meta_description: string;

    @Column('jsonb', { nullable: true, default: [] })
    tags: string[];

    @Column({ default: 0 })
    view_count: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
