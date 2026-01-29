import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Product } from '../products/product.entity';
import { Category } from '../categories/category.entity';
import { Customer, CustomerType } from '../customers/customer.entity';
import { BlogPost, BlogStatus } from '../blogs/blog-post.entity';
import { SystemConfig } from '../system/system-config.entity';
import { SalesService } from '../sales/sales.service';

import { ProductWebsiteConfig } from '../products/entities/product-website-config.entity';

import { SystemService } from '../system/system.service';

@Controller('public')
export class PublicController {
    constructor(
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
        @InjectRepository(ProductWebsiteConfig)
        private readonly websiteConfigRepo: Repository<ProductWebsiteConfig>,
        @InjectRepository(Category)
        private readonly categoryRepo: Repository<Category>,
        @InjectRepository(Customer)
        private readonly customerRepo: Repository<Customer>,
        @InjectRepository(BlogPost)
        private readonly blogRepo: Repository<BlogPost>,
        @InjectRepository(SystemConfig)
        private readonly configRepo: Repository<SystemConfig>,
        private readonly salesService: SalesService,
        private readonly systemService: SystemService // <--- Inject
    ) { }

    // ... (settings code)

    // ========================================
    // PUBLIC CONFIG APIs
    // ========================================

    @Get('home-config')
    async getHomeConfig() {
        return this.systemService.getHomeConfig();
    }

    @Get('settings')
    async getSettings() {
        // Fetch company config from database
        const config = await this.systemService.getCompanyConfig();

        // Return public system settings formatted for website
        return {
            title: config.COMPANY_NAME || 'Hula ERP',
            logo: '/logo.png',
            contact_email: config.COMPANY_EMAIL || '',
            contact_phone: config.COMPANY_PHONE || '',
            contact_address: config.COMPANY_ADDRESS || '',
            website: config.COMPANY_WEBSITE || ''
        };
    }

    // ... (settings code)

    @Get('products/:sku')
    async getProductBySku(@Param('sku') sku: string) {
        const product = await this.productRepo.findOne({
            where: { sku, is_active: true, show_on_website: true }
        });

        if (!product) {
            return { error: 'Product not found' };
        }

        // Fetch website config
        const config = await this.websiteConfigRepo.findOne({
            where: { product_id: product.id }
        });

        return {
            id: product.id,
            sku: product.sku,
            name: product.name,
            category: product.category,
            base_price: product.website_price || product.base_price,
            image_url: product.image_url,
            customer_description: product.customer_description,
            attributes: product.attributes,
            customization_config: config?.customization_config || null
        };
    }

    // ========================================
    // CATEGORIES APIs
    // ========================================

    @Get('categories')
    async getCategories() {
        // Only return categories that have at least one product visible on website
        const categoriesWithProducts = await this.categoryRepo
            .createQueryBuilder('c')
            .innerJoin('c.products', 'p', 'p.is_active = :active AND p.show_on_website = :show', {
                active: true,
                show: true
            })
            .orderBy('c.name', 'ASC')
            .getMany();

        return categoriesWithProducts.map(c => ({
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
        // Build formatted note with full buyer info
        const noteLines = [
            '📦 ĐƠN HÀNG TỪ WEBSITE',
            '─────────────────────────',
            `👤 Tên người mua: ${body.customer_name}`,
            `📞 Số điện thoại: ${body.customer_phone}`,
        ];

        if (body.customer_email) {
            noteLines.push(`📧 Email: ${body.customer_email}`);
        }

        noteLines.push(`📍 Địa chỉ giao hàng: ${body.delivery_address}`);
        noteLines.push(`💳 Phương thức thanh toán: ${body.payment_method === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'COD (Thanh toán khi nhận hàng)'}`);

        if (body.notes) {
            noteLines.push(`📝 Ghi chú: ${body.notes}`);
        }

        const formattedNote = noteLines.join('\n');

        const orderData = {
            // Customer info
            customer_name: body.customer_name,

            // Delivery info - map to correct fields
            receiver_name: body.customer_name,    // Recipient is same as customer
            receiver_phone: body.customer_phone,
            shipping_address: body.delivery_address,

            // Items and formatted note
            items: body.items,
            note: formattedNote,

            // Mark as website order
            order_source: 'WEBSITE'
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
    // ========================================
    // PUBLIC CONFIG APIs
    // ========================================



    // ========================================
    // PRODUCTS APIs (Public)
    // ========================================

    @Get('products')
    async getProducts(
        @Query('page') page = 1,
        @Query('limit') limit = 12,
        @Query('sort') sort = 'newest', // newest, price_asc, price_desc
        @Query('category') categoryId?: number
    ) {
        const qb = this.productRepo.createQueryBuilder('p')
            .leftJoinAndSelect('p.category_link', 'cat')
            .where('p.is_active = :isActive', { isActive: true })
            .andWhere('p.show_on_website = :show', { show: true });

        if (categoryId) {
            qb.andWhere('p.category_id = :catId', { catId: categoryId });
        }

        // Sorting
        switch (sort) {
            case 'price_asc':
                // Use website_price if available, else base_price
                qb.orderBy('COALESCE(p.website_price, p.base_price)', 'ASC');
                break;
            case 'price_desc':
                qb.orderBy('COALESCE(p.website_price, p.base_price)', 'DESC');
                break;
            case 'newest':
            default:
                qb.orderBy('p.id', 'DESC');
                break;
        }

        const [items, total] = await qb
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return {
            data: items.map(p => ({
                id: p.id,
                sku: p.sku,
                name: p.name,
                image_url: p.image_url,
                price: p.website_price || p.base_price || 0,
                original_price: p.base_price, // Show strike-through if website_price < base_price
                category: p.category_link?.name || 'Uncategorized',
                slug: p.sku // In Hula, SKU is effectively the slug
            })),
            meta: {
                total,
                page: Number(page),
                last_page: Math.ceil(total / limit)
            }
        };
    }
}
