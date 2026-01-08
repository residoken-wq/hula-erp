import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import { Category } from '../categories/category.entity';
import { Customer, CustomerType } from '../customers/customer.entity';
import { BlogPost, BlogStatus } from '../blogs/blog-post.entity';
import { SalesService } from '../sales/sales.service';

@Controller('public')
export class PublicController {
    constructor(
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
        @InjectRepository(Category)
        private readonly categoryRepo: Repository<Category>,
        @InjectRepository(Customer)
        private readonly customerRepo: Repository<Customer>,
        @InjectRepository(BlogPost)
        private readonly blogRepo: Repository<BlogPost>,
        private readonly salesService: SalesService
    ) { }

    // ========================================
    // PRODUCTS APIs
    // ========================================

    @Get('products')
    async getProducts(
        @Query('category') category?: string,
        @Query('limit') limit?: number
    ) {
        const query = this.productRepo.createQueryBuilder('p')
            .where('p.is_active = :active', { active: true })
            .orderBy('p.created_at', 'DESC');

        if (category) {
            query.andWhere('p.category = :category', { category });
        }

        if (limit) {
            query.take(Number(limit));
        }

        const products = await query.getMany();

        // Return only public-safe fields
        return products.map(p => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            category: p.category,
            base_price: p.base_price,
            image_url: p.image_url,
            customer_description: p.customer_description,
            attributes: p.attributes
        }));
    }

    @Get('products/:sku')
    async getProductBySku(@Param('sku') sku: string) {
        const product = await this.productRepo.findOne({
            where: { sku, is_active: true }
        });

        if (!product) {
            return { error: 'Product not found' };
        }

        return {
            id: product.id,
            sku: product.sku,
            name: product.name,
            category: product.category,
            base_price: product.base_price,
            image_url: product.image_url,
            customer_description: product.customer_description,
            attributes: product.attributes
        };
    }

    // ========================================
    // CATEGORIES APIs
    // ========================================

    @Get('categories')
    async getCategories() {
        const categories = await this.categoryRepo.find({
            order: { name: 'ASC' }
        });
        return categories.map(c => ({
            id: c.id,
            code: c.code,
            name: c.name
        }));
    }

    // ========================================
    // BLOGS APIs
    // ========================================

    @Get('blogs')
    async getBlogs(@Query('limit') limit?: number) {
        const query = this.blogRepo.createQueryBuilder('b')
            .where('b.status = :status', { status: BlogStatus.PUBLISHED })
            .orderBy('b.published_at', 'DESC');

        if (limit) {
            query.take(Number(limit));
        }

        const blogs = await query.getMany();
        return blogs.map(b => ({
            id: b.id,
            slug: b.slug,
            title: b.title,
            excerpt: b.excerpt,
            featured_image: b.featured_image,
            category: b.category,
            published_at: b.published_at,
            view_count: b.view_count
        }));
    }

    @Get('blogs/:slug')
    async getBlogBySlug(@Param('slug') slug: string) {
        const blog = await this.blogRepo.findOne({
            where: { slug, status: BlogStatus.PUBLISHED },
            relations: ['author']
        });

        if (!blog) {
            return { error: 'Blog not found' };
        }

        // Increment view count
        await this.blogRepo.increment({ id: blog.id }, 'view_count', 1);

        return {
            id: blog.id,
            slug: blog.slug,
            title: blog.title,
            excerpt: blog.excerpt,
            content: blog.content,
            featured_image: blog.featured_image,
            category: blog.category,
            published_at: blog.published_at,
            meta_title: blog.meta_title,
            meta_description: blog.meta_description,
            tags: blog.tags,
            author: blog.author ? { id: blog.author.id, username: blog.author.username } : null
        };
    }

    // ========================================
    // LEADS APIs (Form đăng ký sỉ)
    // ========================================

    @Post('leads')
    async createLead(@Body() body: {
        company_name: string;
        contact_person: string;
        phone: string;
        email?: string;
        address?: string;
        expected_quantity?: string;
        notes?: string;
    }) {
        // Generate unique code for lead
        const count = await this.customerRepo.count({ where: { type: CustomerType.LEAD } });
        const code = `LEAD-${String(count + 1).padStart(5, '0')}`;

        const lead = this.customerRepo.create({
            code,
            name: body.company_name,
            phone: body.phone,
            email: body.email,
            address: body.address,
            type: CustomerType.LEAD,
            lead_status: 'NEW',
            history: [{
                action: 'CREATED_FROM_WEBSITE',
                timestamp: new Date(),
                data: {
                    contact_person: body.contact_person,
                    expected_quantity: body.expected_quantity,
                    notes: body.notes
                }
            }]
        });

        await this.customerRepo.save(lead);

        return {
            success: true,
            message: 'Đăng ký thành công! Chúng tôi sẽ liên hệ bạn sớm.',
            lead_code: code
        };
    }

    // ========================================
    // ORDERS APIs (ShopCart checkout)
    // ========================================

    @Post('orders')
    async createOrder(@Body() body: {
        customer_name: string;
        customer_phone: string;
        customer_email?: string;
        delivery_address: string;
        items: Array<{
            sku: string;
            quantity: number;
            unit_price: number;
        }>;
        notes?: string;
        payment_method?: string;
    }) {
        // Create order via SalesService
        const orderData = {
            customer_name: body.customer_name,
            customer_phone: body.customer_phone,
            customer_email: body.customer_email,
            delivery_address: body.delivery_address,
            items: body.items,
            notes: body.notes,
            order_type: 'WEBSITE', // Mark as website order
            status: 'PENDING'
        };

        try {
            const order = await this.salesService.createOrder(orderData);
            return {
                success: true,
                message: 'Đặt hàng thành công!',
                order_code: order.order_code
            };
        } catch (error) {
            return {
                success: false,
                message: 'Có lỗi xảy ra, vui lòng thử lại.',
                error: error.message
            };
        }
    }
}
