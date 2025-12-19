import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Modules
import { ProductsModule } from './products/products.module';
import { MaterialsModule } from './materials/materials.module';
import { BomModule } from './bom/bom.module';
import { SalesModule } from './sales/sales.module';
import { InventoryModule } from './inventory/inventory.module';
import { ProductionModule } from './production/production.module';
import { PurchasingModule } from './purchasing/purchasing.module';
import { FinanceModule } from './finance/finance.module';
import { UploadModule } from './upload/upload.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { CustomersModule } from './customers/customers.module';
import { PlanningModule } from './planning/planning.module';
import { ProcessesModule } from './processes/processes.module';
import { CategoriesModule } from './categories/categories.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module'; // <--- MỚI
import { NotificationsModule } from './notifications/notifications.module'; // <--- MỚI

// Entities
import { Product } from './products/product.entity';
import { Material } from './materials/material.entity';
import { BOM } from './bom/bom.entity'; 
import { ProductComponent } from './products/product-component.entity';
import { ProductRouting } from './products/product-routing.entity';
import { ProductLogistics } from './products/product-logistics.entity';
import { ProductPattern } from './products/product-pattern.entity';

import { SalesOrder } from './sales/sales-order.entity';
import { SalesOrderItem } from './sales/sales-order-item.entity';
import { ProductSample } from './sales/product-sample.entity';
import { SalesDelivery } from './sales/sales-delivery.entity';
import { SalesDeliveryItem } from './sales/sales-delivery-item.entity';
import { SalesComment } from './sales/sales-comment.entity';
import { PriceList } from './sales/pricelist/price-list.entity';
import { PriceListRule } from './sales/pricelist/price-list-rule.entity';

import { StockHistory } from './inventory/stock-history.entity';
import { InventoryStock } from './inventory/inventory-stock.entity';

import { PurchaseOrder } from './purchasing/entities/purchase-order.entity';
import { PurchaseOrderItem } from './purchasing/entities/purchase-order-item.entity';
import { GoodsReceipt } from './purchasing/entities/goods-receipt.entity';

import { ProductionOrder } from './production/entities/production-order.entity';

// Finance Entities
import { Transaction } from './finance/transaction.entity';
import { TransactionCategory } from './finance/transaction-category.entity'; 

// Task & Notification Entities (MỚI)
import { Task } from './tasks/task.entity';
import { Notification } from './notifications/notification.entity';

import { Supplier } from './suppliers/supplier.entity';
import { SupplierMaterial } from './suppliers/supplier-material.entity';
import { SupplierContact } from './suppliers/supplier-contact.entity';
import { Customer } from './customers/customer.entity';
import { CustomerContact } from './customers/customer-contact.entity';
import { ProductionPlan } from './planning/production-plan.entity';
import { Process } from './processes/process.entity';
import { Category } from './categories/category.entity';

// User Entities
import { User } from './users/entities/user.entity';
import { UserGroup } from './users/entities/user-group.entity';
import { GroupPermission } from './users/entities/group-permission.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'db',
      port: 5432,
      username: process.env.DB_USERNAME || 'hula_user',
      password: process.env.DB_PASSWORD || 'hula_password',
      database: process.env.DB_DATABASE || 'hula_db',
      entities: [
        // Sản phẩm & BOM
        Product, Material, BOM, ProductComponent, ProductRouting, ProductLogistics, ProductPattern,
        
        // Bán hàng
        SalesOrder, SalesOrderItem, ProductSample, SalesDelivery, SalesDeliveryItem, SalesComment,
        PriceList, PriceListRule,
        
        // Mua hàng
        PurchaseOrder, PurchaseOrderItem, GoodsReceipt, 
        
        // Kho
        StockHistory, InventoryStock,
        
        // Sản xuất
        ProductionOrder, 
        
        // Tài chính
        Transaction, TransactionCategory,
        
        // Công việc & Thông báo (MỚI)
        Task, Notification,
        
        // Đối tác & Khác
        Supplier, SupplierMaterial, SupplierContact,
        Customer, CustomerContact,
        ProductionPlan, Process, Category,
        
        // Hệ thống & User
        User, UserGroup, GroupPermission
      ], 
      synchronize: true, 
    }),
    
    // Modules Registry
    UsersModule, AuthModule,
    ProductsModule, MaterialsModule, BomModule, SalesModule,
    InventoryModule, ProductionModule, PurchasingModule, FinanceModule,
    TasksModule, NotificationsModule, // <--- ĐĂNG KÝ MODULE MỚI
    UploadModule, SuppliersModule, CustomersModule, PlanningModule,
    ProcessesModule, CategoriesModule,
  ],
})
export class AppModule {}