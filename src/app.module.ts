import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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

// Entities
import { Product } from './products/product.entity';
import { Material } from './materials/material.entity';
import { BOM } from './bom/bom.entity';
import { ProductComponent } from './products/product-component.entity';
import { SalesOrder } from './sales/sales-order.entity';
import { SalesOrderItem } from './sales/sales-order-item.entity';
import { StockHistory } from './inventory/stock-history.entity';
import { WorkOrder } from './production/work-order.entity';
import { PurchaseOrder } from './purchasing/purchase-order.entity';
import { PurchaseOrderItem } from './purchasing/purchase-order-item.entity';
import { Transaction } from './finance/transaction.entity';
import { Supplier } from './suppliers/supplier.entity';
import { SupplierMaterial } from './suppliers/supplier-material.entity';
import { SupplierContact } from './suppliers/supplier-contact.entity';
import { Customer } from './customers/customer.entity';
import { CustomerContact } from './customers/customer-contact.entity'; // MOI
import { ProductionPlan } from './planning/production-plan.entity';

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
        Product, Material, BOM, ProductComponent,
        SalesOrder, SalesOrderItem, StockHistory, 
        WorkOrder, 
        PurchaseOrder, PurchaseOrderItem,
        Transaction,
        Supplier, SupplierMaterial, SupplierContact,
        Customer, CustomerContact, // MOI
        ProductionPlan
      ], 
      synchronize: true, 
    }),
    ProductsModule,
    MaterialsModule,
    BomModule,
    SalesModule,
    InventoryModule,
    ProductionModule,
    PurchasingModule,
    FinanceModule,
    UploadModule,
    SuppliersModule,
    CustomersModule,
    PlanningModule
  ],
})
export class AppModule {}