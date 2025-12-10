import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder, SalesOrderStatus } from './sales-order.entity';
import { SalesOrderItem } from './sales-order-item.entity';
import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(SalesOrder) private orderRepo: Repository<SalesOrder>,
    private productsService: ProductsService,
    private inventoryService: InventoryService,
  ) {}

  async createOrder(data: any) {
    if (!data.items || data.items.length === 0) {
        throw new NotFoundException('Don hang phai co it nhat 1 san pham');
    }

    const order = new SalesOrder();
    order.order_code = data.order_code;
    if(data.customer_id) {
        order.customer = { id: data.customer_id } as any;
    }
    order.customer_name = data.customer_name;
    order.items = [];
    
    let totalAmount = 0;
    let totalCost = 0;

    for (const itemData of data.items) {
      const item = new SalesOrderItem();
      item.sku = itemData.sku;
      item.quantity = itemData.quantity;
      item.unit_price = itemData.price;
      item.subtotal = item.quantity * item.unit_price;
      
      totalAmount += item.subtotal;

      try {
        const costInfo = await this.productsService.calculateCostPrice(item.sku);
        const unitCost = costInfo.new_cost_price || 0;
        totalCost += (unitCost * item.quantity);
      } catch (e) {
        console.log('Khong tinh duoc gia von');
      }

      const product = await this.productsService.findOneBySku(item.sku);
      if (product) {
        await this.inventoryService.adjustStock(
            'EXPORT', 'PRODUCT', product.id, item.quantity, data.order_code, 'Ban hang'
        );
      }
      order.items.push(item);
    }

    order.total_amount = totalAmount;
    order.total_cost = totalCost;
    order.status = SalesOrderStatus.CONFIRMED;
    return this.orderRepo.save(order);
  }

  // --- API MỚI: Lấy danh sách đơn hàng ---
  async findAll() {
    return this.orderRepo.find({ 
        order: { order_date: 'DESC' },
        relations: ['customer'] 
    });
  }
  // ---------------------------------------

  async getOrder(orderCode: string) {
    const order = await this.orderRepo.findOne({ 
      where: { order_code: orderCode },
      relations: ['items', 'customer'] 
    });
    if (!order) throw new NotFoundException('Khong tim thay don hang');

    const profit = order.total_amount - order.total_cost;
    const margin = order.total_amount > 0 ? (profit / order.total_amount) * 100 : 0;

    return {
      ...order,
      financial_analysis: {
        revenue: order.total_amount,
        cogs: order.total_cost,
        gross_profit: profit,
        margin_percent: Math.round(margin * 100) / 100 + '%'
      }
    };
  }

  async updatePayment(orderCode: string, amount: number) {
    const order = await this.orderRepo.findOne({ where: { order_code: orderCode } });
    if (!order) throw new NotFoundException('Khong tim thay don hang');
    
    order.paid_amount = Number(order.paid_amount) + Number(amount);
    return this.orderRepo.save(order);
  }
}