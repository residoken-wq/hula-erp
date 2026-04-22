import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { SystemConfig } from './system-config.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { ContractTemplate } from './contract-template.entity';
import { EmailTemplate } from './email-template.entity';
import { EmailService } from '../common/services/email.service';

import { ActivitySubscriber } from './subscribers/activity.subscriber';
import { UserContextService } from '../common/services/user-context.service';

import { DashboardController } from './dashboard.controller';
import { SalesOrder } from '../sales/sales-order.entity';
import { InventoryStock } from '../inventory/inventory-stock.entity';
import { GoodsReceipt } from '../inventory/entities/goods-receipt.entity';
import { PurchaseOrder } from '../purchasing/entities/purchase-order.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            SystemConfig,
            ActivityLog,
            ContractTemplate,
            EmailTemplate,
            SalesOrder,
            InventoryStock,
            GoodsReceipt,
            PurchaseOrder
        ])
    ],
    controllers: [SystemController, DashboardController],
    providers: [SystemService, ActivitySubscriber, UserContextService, EmailService],
    exports: [SystemService, UserContextService]
})
export class SystemModule { }
