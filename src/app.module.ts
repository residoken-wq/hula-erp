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
import { TasksModule } from './tasks/tasks.module';
import { NotificationsModule } from './notifications/notifications.module';
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
import { SalesChecklist } from './sales/sales-checklist.entity';
import { SalesChecklistItem } from './sales/sales-checklist-item.entity';
import { PriceList } from './sales/pricelist/price-list.entity';
import { PriceListRule } from './sales/pricelist/price-list-rule.entity';
import { SalesOrderVersion } from './sales/sales-order-version.entity';

// ... (inside @Module)

entities: [
  Product, Material, BOM, ProductComponent, ProductRouting, ProductLogistics, ProductPattern,
  SalesOrder, SalesOrderItem, ProductSample, SalesDelivery, SalesDeliveryItem, SalesComment,
  SalesChecklist, SalesChecklistItem,
  PriceList, PriceListRule, SalesOrderVersion,
  PurchaseOrder, PurchaseOrderItem, GoodsReceipt, GoodsReceiptItem,
  StockHistory, InventoryStock,
  ProductionOrder,
  Transaction, TransactionCategory,
  Task, Notification,
  Supplier, SupplierMaterial, SupplierContact,
  Customer, CustomerContact,
  ProductionPlan, Process, Category,
  User, UserGroup, GroupPermission,
  SystemConfig, ActivityLog
],
  synchronize: configService.get<string>('NODE_ENV') !== 'production',
    subscribers: [], // Auto-registration should work if provided in Module, but explicit might be needed if not. 
        // Note: NestJS TypeOrmModule auto-loads subscribers if registered as providers in modules.
      }),
    }),
UsersModule, AuthModule,
  ProductsModule, MaterialsModule, BomModule, SalesModule,
  InventoryModule, ProductionModule, PurchasingModule, FinanceModule,
  TasksModule, NotificationsModule, SystemModule,
  UploadModule, SuppliersModule, CustomersModule, PlanningModule,
  ProcessesModule, CategoriesModule, AiModule,
  TypeOrmModule.forFeature([User]), // Needed for ActivityInterceptor
  ],
providers: [
  {
    provide: 'APP_INTERCEPTOR',
    useClass: ActivityInterceptor,
  },
],
  controllers: [AppController]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserContextMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}