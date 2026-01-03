import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { SystemConfig } from './system-config.entity';
import { ActivityLog } from './entities/activity-log.entity';

import { ActivitySubscriber } from './subscribers/activity.subscriber';
import { UserContextService } from '../common/services/user-context.service';

import { DashboardController } from './dashboard.controller'; // <--- NEW
import { SalesOrder } from '../sales/sales-order.entity';
import { InventoryStock } from '../inventory/inventory-stock.entity';
import { GoodsReceipt } from '../inventory/entities/goods-receipt.entity';
import { PurchaseOrder } from '../purchasing/entities/purchase-order.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            SystemConfig,
            ActivityLog,
            SalesOrder,      // <--- For Dashboard
            InventoryStock,  // <--- For Dashboard
            GoodsReceipt,    // <--- For Dashboard
            PurchaseOrder    // <--- For Dashboard
        ])
    ],
    controllers: [SystemController, DashboardController], // <--- Register DashboardController
    providers: [SystemService, ActivitySubscriber, UserContextService],
    exports: [SystemService, UserContextService]
})
export class SystemModule { }
