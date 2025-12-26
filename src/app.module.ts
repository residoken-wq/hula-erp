import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

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
import { SystemModule } from './system/system.module';

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
import { SalesOrderVersion } from './sales/sales-order-version.entity'; // <--- NEW

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
import { SystemConfig } from './system/system-config.entity';
import { ActivityLog } from './system/entities/activity-log.entity'; // <--- NEW

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST') || 'hula_db',
        port: configService.get<number>('DB_PORT') || 5432,
        username: configService.get<string>('DB_USERNAME') || 'hula_user',
        password: configService.get<string>('DB_PASSWORD') || 'hula_password',
        database: configService.get<string>('DB_DATABASE') || 'hula_db',
        entities: [
          Product, Material, BOM, ProductComponent, ProductRouting, ProductLogistics, ProductPattern,
          SalesOrder, SalesOrderItem, ProductSample, SalesDelivery, SalesDeliveryItem, SalesComment,
          PriceList, PriceListRule, SalesOrderVersion, // <--- NEW
          PurchaseOrder, PurchaseOrderItem, GoodsReceipt,
          StockHistory, InventoryStock,
          ProductionOrder,
          Transaction, TransactionCategory,
          Task, Notification,
          Supplier, SupplierMaterial, SupplierContact,
          Customer, CustomerContact,
          ProductionPlan, Process, Category,
          User, UserGroup, GroupPermission,
          SystemConfig, ActivityLog // <--- NEW
        ],
        synchronize: configService.get<string>('NODE_ENV') !== 'production', // Disable in production
      }),
    }),

import { AppController } from './app.controller'; // <--- IMPORT

@Module({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        // ... (imports)
        UsersModule, AuthModule,
        ProductsModule, MaterialsModule, BomModule, SalesModule,
        InventoryModule, ProductionModule, PurchasingModule, FinanceModule,
        TasksModule, NotificationsModule, SystemModule,
        UploadModule, SuppliersModule, CustomersModule, PlanningModule,
        ProcessesModule, CategoriesModule,
      ],
      controllers: [AppController] // <--- ADD CONTROLLER
    })
  export class AppModule { }