import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost, BlogStatus } from './blog-post.entity';

@Injectable()
export class BlogsService {
    constructor(
        @InjectRepository(BlogPost)
        private readonly blogRepo: Repository<BlogPost>
    ) { }

    // --- PUBLIC APIs ---
    async findPublished() {
        return this.blogRepo.find({
            where: { status: BlogStatus.PUBLISHED },
            order: { published_at: 'DESC' },
            relations: ['author']
        });
    }

    async findBySlug(slug: string) {
        const post = await this.blogRepo.findOne({
            where: { slug, status: BlogStatus.PUBLISHED },
            relations: ['author']
        });
        if (!post) throw new NotFoundException('Blog post not found');

        // Increment view count
        await this.blogRepo.increment({ id: post.id }, 'view_count', 1);
        return post;
    }

    // --- CMS APIs ---
    async findAll() {
        return this.blogRepo.find({
            order: { created_at: 'DESC' },
            relations: ['author']
        });
    }

    async findOne(id: number) {
        const post = await this.blogRepo.findOne({
            where: { id },
            relations: ['author']
        });
        if (!post) throw new NotFoundException('Blog post not found');
        return post;
    }

    async create(data: Partial<BlogPost>) {
        // Auto-generate slug from title
        if (!data.slug && data.title) {
            data.slug = this.generateSlug(data.title);
        }

        // Ensure slug is unique
        if (data.slug) {
            let slug = data.slug;
            let counter = 1;
            while (await this.blogRepo.findOne({ where: { slug } })) {
                slug = `${data.slug}-${counter}`;
                counter++;
            }
            data.slug = slug;
        }

        const post = this.blogRepo.create(data);
        return this.blogRepo.save(post);
    }

    async update(id: number, data: Partial<BlogPost>) {
        const post = await this.findOne(id);
        Object.assign(post, data);
        return this.blogRepo.save(post);
    }

    async publish(id: number) {
        const post = await this.findOne(id);
        post.status = BlogStatus.PUBLISHED;
        post.published_at = new Date();
        return this.blogRepo.save(post);
    }

    async unpublish(id: number) {
        const post = await this.findOne(id);
        post.status = BlogStatus.DRAFT;
        return this.blogRepo.save(post);
    }

    async remove(id: number) {
        const post = await this.findOne(id);
        return this.blogRepo.remove(post);
    }

    private generateSlug(title: string): string {
        return title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }
}
