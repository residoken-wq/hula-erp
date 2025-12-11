import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder, SalesOrderStatus } from './sales-order.entity';
import { SalesOrderItem } from './sales-order-item.entity';
import { ProductSample } from './product-sample.entity';
import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(SalesOrder) public orderRepo: Repository<SalesOrder>,
    @InjectRepository(ProductSample) public sampleRepo: Repository<ProductSample>,
    private productsService: ProductsService,
    private inventoryService: InventoryService,
    private customersService: CustomersService,
  ) {}

  private async validateItemsForSO(items: any[]) {
      for (const item of items) {
          const product = await this.productsService.findOneBySku(item.sku);
          if (!product) throw new NotFoundException(`Sản phẩm ${item.sku} không tồn tại`);
          const hasColor = product.attributes && product.attributes.color;
          const isCombo = (product.category || '').toLowerCase().includes('combo');
          if (!hasColor && !isCombo) {
              throw new BadRequestException(`Lỗi dòng hàng "${product.name}": SP phải có màu/biến thể.`);
          }
      }
  }

  async createOrder(data: any) {
    if (!data.isQuotation) await this.validateItemsForSO(data.items);
    
    const order = new SalesOrder();
    order.order_code = data.order_code;
    if(data.customer_id) order.customer = { id: data.customer_id } as any;
    order.customer_name = data.customer_name;
    order.shipping_address = data.shipping_address;
    order.items = [];
    
    let totalAmount = 0; let totalCost = 0;

    for (const itemData of data.items) {
      const item = new SalesOrderItem();
      item.sku = itemData.sku; item.quantity = itemData.quantity; item.unit_price = itemData.price;
      item.subtotal = item.quantity * item.unit_price;
      
      totalAmount += item.subtotal;

      try {
        const costInfo = await this.productsService.calculateCostPrice(item.sku);
        totalCost += (costInfo.new_cost_price || 0) * item.quantity;
      } catch (e) {}

      if (!data.isQuotation) {
          const product = await this.productsService.findOneBySku(item.sku);
          if (product) await this.inventoryService.adjustStock('EXPORT', 'PRODUCT', product.id, item.quantity, data.order_code, 'Bán hàng');
      }
      order.items.push(item);
    }

    order.total_amount = totalAmount; order.total_cost = totalCost;
    order.status = data.isQuotation ? SalesOrderStatus.QUOTATION : SalesOrderStatus.SO_PENDING;

    return this.orderRepo.save(order);
  }

  async findAll() { return this.orderRepo.find({ order: { order_date: 'DESC' }, relations: ['customer'] }); }
  async getOrder(code: string) { return this.orderRepo.findOne({ where: { order_code: code }, relations: ['items', 'customer'] }); }

  async convertQuoteToSo(id: number, accepted: boolean) {
      const order = await this.orderRepo.findOne({ where: { id }, relations: ['items'] });
      if(!order) throw new NotFoundException('Không tìm thấy báo giá');
      
      if (!accepted) { 
          order.status = SalesOrderStatus.CANCELLED; 
      } else {
          await this.validateItemsForSO(order.items);
          for (const item of order.items) {
              const product = await this.productsService.findOneBySku(item.sku);
              if (product) await this.inventoryService.adjustStock('EXPORT', 'PRODUCT', product.id, item.quantity, order.order_code, 'Chốt Báo Giá -> SO');
          }
          order.status = SalesOrderStatus.SO_PENDING;
          if(order.customer_id) await this.customersService.convertToCustomer(order.customer_id);
      }
      return this.orderRepo.save(order);
  }

  async updatePayment(orderCode: string, amount: number) {
    const order = await this.orderRepo.findOne({ where: { order_code: orderCode } });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    order.paid_amount = Number(order.paid_amount || 0) + Number(amount);
    return this.orderRepo.save(order);
  }

  // --- API UPDATE QUOTE (CRUD) ---
  async updateQuote(id: number, data: any) {
      const order = await this.orderRepo.findOne({ where: { id }, relations: ['items'] });
      if (!order) throw new NotFoundException('Không tìm thấy báo giá');
      
      // RULE: Chỉ cho sửa khi đang là QUOTATION
      if (order.status !== SalesOrderStatus.QUOTATION) {
          throw new BadRequestException('Chỉ có thể sửa Báo giá khi chưa chốt đơn!');
      }

      // Cập nhật thông tin chung
      if (data.customer_id) order.customer = { id: data.customer_id } as any;
      
      // Cập nhật Items: Xóa cũ -> Thêm mới (Cách đơn giản nhất để tránh diff phức tạp)
      // Lưu ý: Do cascade: true trong Entity, ta chỉ cần gán mảng items mới, TypeORM sẽ tự xử lý (nhưng an toàn nhất là xóa items cũ trước)
      // Tuy nhiên, để đơn giản trong TypeORM, ta sẽ tính toán lại và thay thế list items
      
      // Xóa items cũ thủ công để tránh rác (nếu cascade không cover hết case update)
      // (Thực tế nên Inject SalesOrderItemRepo để delete, nhưng ở đây ta dùng save đè)
      
      const newItems = [];
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
            totalCost += (costInfo.new_cost_price || 0) * item.quantity;
          } catch (e) {}

          newItems.push(item);
      }

      // Gán lại dữ liệu mới
      order.items = newItems;
      order.total_amount = totalAmount;
      order.total_cost = totalCost;

      return this.orderRepo.save(order);
  }

  // --- API DELETE QUOTE (CRUD) ---
  async deleteQuote(id: number) {
      const order = await this.orderRepo.findOne({ where: { id } });
      if (!order) throw new NotFoundException('Không tìm thấy báo giá');

      // RULE: Không được xóa nếu đã Chốt đơn (SO_PENDING), Đã lên KH (PLANNED), v.v.
      const allowedStatus = [SalesOrderStatus.QUOTATION, SalesOrderStatus.CANCELLED];
      if (!allowedStatus.includes(order.status)) {
          throw new BadRequestException('Không thể xóa Báo giá đã được duyệt/chốt đơn!');
      }

      return this.orderRepo.remove(order);
  }
}