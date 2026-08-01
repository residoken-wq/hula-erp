import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ProductsService } from './src/products/products.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductRouting } from './src/products/product-routing.entity';
import { Product } from './src/products/product.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const routingRepo: Repository<ProductRouting> = app.get(getRepositoryToken(ProductRouting));
  const productRepo: Repository<Product> = app.get(getRepositoryToken(Product));

  const products = await productRepo.find({
    where: [
      { name: 'Túi quai đeo Trí Đức Plus' },
      { name: 'Bộ nệm mầm non Cara tiêu chuẩn hồng' },
      { name: 'Chăn mầm non cara 130 x 90 cm Hồng' }
    ]
  });

  for (const p of products) {
    console.log(`Product: ${p.name} (ID: ${p.id})`);
    const routings = await routingRepo.find({ where: { product_id: p.id } });
    console.log(`  Routings:`, routings);
  }

  await app.close();
}
bootstrap();
