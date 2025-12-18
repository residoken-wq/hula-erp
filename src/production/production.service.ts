import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionOrder } from './entities/production-order.entity';
import { InventoryService } from '../inventory/inventory.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class ProductionService {
  constructor(
    @InjectRepository(ProductionOrder) private prodRepo: Repository<ProductionOrder>,
    private inventoryService: InventoryService,
    private productsService: ProductsService,
  ) {}

  async createOrder(data: any) {
      const order = this.prodRepo.create({
          code: data.code,
          product_id: data.product_id,
          quantity: data.quantity,
          start_date: data.start_date,
          due_date: data.due_date,
          status: 'PLANNED'
      });
      return this.prodRepo.save(order);
  }

  async getAllOrders() {
      return this.prodRepo.find({ 
          order: { created_at: 'DESC' },
          relations: ['product'] 
      });
  }

  // --- BẮT ĐẦU SẢN XUẤT: XUẤT NGUYÊN LIỆU ---
  async startProduction(id: number) {
      const order = await this.prodRepo.findOne({ where: { id }, relations: ['product'] });
      if (!order) throw new NotFoundException('Order not found');
      if (order.status !== 'PLANNED') throw new BadRequestException('Chỉ đơn PLANNED mới được start');

      // 1. Lấy BOM của sản phẩm
      const boms = await this.productsService.getProductBOM(order.product.sku);
      
      // 2. Trừ kho Nguyên Liệu
      for (const bom of boms) {
          const quantityToDeduct = Number(bom.quantity) * Number(order.quantity);
          
          // --- FIX LỖI Ở ĐÂY: Thêm 'KHO_NPL' ---
          await this.inventoryService.adjustStock(
              'EXPORT',
              'MATERIAL',
              bom.material_id,
              quantityToDeduct,
              order.code,
              `Xuất sản xuất lệnh ${order.code}`,
              'KHO_NPL' // <--- XUẤT TỪ KHO NGUYÊN LIỆU
          );
      }

      order.status = 'IN_PROGRESS';
      return this.prodRepo.save(order);
  }

  // --- HOÀN THÀNH SẢN XUẤT: NHẬP THÀNH PHẨM ---
  async finishProduction(id: number) {
      const order = await this.prodRepo.findOne({ where: { id } });
      if (!order) throw new NotFoundException('Order not found');
      if (order.status !== 'IN_PROGRESS') throw new BadRequestException('Chỉ đơn đang chạy mới finish được');

      // --- FIX LỖI Ở ĐÂY: Thêm 'KHO_TP' ---
      await this.inventoryService.adjustStock(
          'IMPORT',
          'PRODUCT',
          order.product_id,
          Number(order.quantity),
          order.code,
          `Nhập kho thành phẩm lệnh ${order.code}`,
          'KHO_TP' // <--- NHẬP VÀO KHO THÀNH PHẨM
      );

      order.status = 'COMPLETED';
      return this.prodRepo.save(order);
  }
}