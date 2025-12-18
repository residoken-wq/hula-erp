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
// --- MỚI: USERS MODULE ---
import { UsersModule } from './users/users.module';
// -------------------------

// Entities
import { Product } from './products/product.entity';
import { Material } from './materials/material.entity';
import { BOM } from './bom/bom.entity';
import { ProductComponent } from './products/product-component.entity';
import { ProductRouting } from './products/product-routing.entity';
import { ProductLogistics } from './products/product-logistics.entity';
import { SalesComment } from './sales/sales-comment.entity';
import { SalesOrder } from './sales/sales-order.entity';
import { SalesOrderItem } from './sales/sales-order-item.entity';
import { ProductSample } from './sales/product-sample.entity';
import { SalesDelivery } from './sales/sales-delivery.entity';
import { SalesDeliveryItem } from './sales/sales-delivery-item.entity';
import { PriceList } from './sales/pricelist/price-list.entity';
import { PriceListRule } from './sales/pricelist/price-list-rule.entity';
import { StockHistory } from './inventory/stock-history.entity';
import { WorkOrder } from './production/work-order.entity';
import { WorkOrderStep } from './production/work-order-step.entity';
import { PurchaseOrder } from './purchasing/purchase-order.entity';
import { PurchaseOrderItem } from './purchasing/purchase-order-item.entity';
import { PurchaseDelivery } from './purchasing/purchase-delivery.entity'; 
import { Transaction } from './finance/transaction.entity';
import { Supplier } from './suppliers/supplier.entity';
import { SupplierMaterial } from './suppliers/supplier-material.entity';
import { SupplierContact } from './suppliers/supplier-contact.entity';
import { Customer } from './customers/customer.entity';
import { CustomerContact } from './customers/customer-contact.entity';
import { ProductionPlan } from './planning/production-plan.entity';
import { Process } from './processes/process.entity';
import { Category } from './categories/category.entity';
import { AuthModule } from './auth/auth.module';
import { InventoryStock } from './inventory/inventory-stock.entity';

// --- MỚI: USER ENTITIES ---
import { User } from './users/entities/user.entity';
import { UserGroup } from './users/entities/user-group.entity';
import { GroupPermission } from './users/entities/group-permission.entity';
// --------------------------

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'db',
      port: 5432,
      username: 'hula_user',
      password: 'hula_password',
      database: 'hula_db',
      entities: [
        Product, Material, BOM, ProductComponent, ProductRouting, ProductLogistics,
        SalesOrder, SalesOrderItem, ProductSample, SalesDelivery, SalesDeliveryItem, SalesComment,
        PriceList, PriceListRule,
        PurchaseOrder, PurchaseOrderItem, PurchaseDelivery, 
        StockHistory, 
        WorkOrder, WorkOrderStep,
        Transaction,
        Supplier, SupplierMaterial, SupplierContact,
        Customer, CustomerContact,
        ProductionPlan, Process, Category,
        // --- ĐĂNG KÝ ENTITIES USER ---
        User, UserGroup, GroupPermission
        // -----------------------------
      ], 
      synchronize: true, // Auto create tables
    }),
    ProductsModule, MaterialsModule, BomModule, SalesModule,
    InventoryModule, ProductionModule, PurchasingModule, FinanceModule,
    UploadModule, SuppliersModule, CustomersModule, PlanningModule,
    ProcessesModule, CategoriesModule,
    // --- ĐĂNG KÝ MODULE USER ---
    UsersModule, 
    AuthModule,
    // --------------------------
  ],
})
export class AppModule {}