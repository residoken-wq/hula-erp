import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicController } from './public.controller';
import { Product } from '../products/product.entity';
import { Category } from '../categories/category.entity';
import { Customer } from '../customers/customer.entity';
import { BlogPost } from '../blogs/blog-post.entity';
import { SystemConfig } from '../system/system-config.entity';
import { SalesModule } from '../sales/sales.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Product, Category, Customer, BlogPost, SystemConfig]),
        SalesModule
    ],
    controllers: [PublicController]
})
export class PublicModule { }
