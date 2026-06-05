import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiMessage } from './ai-message.entity';
import { ProductsModule } from '../products/products.module';
import { FinanceModule } from '../finance/finance.module';
import { SalesModule } from '../sales/sales.module';
import { CustomersModule } from '../customers/customers.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PlanningModule } from '../planning/planning.module';
import { TasksModule } from '../tasks/tasks.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([AiMessage]),
        ProductsModule,
        FinanceModule,
        SalesModule,
        CustomersModule,
        InventoryModule,
        PlanningModule,
        TasksModule,
        UsersModule
    ],
    controllers: [AiController],
    providers: [AiService],
    exports: [AiService]
})
export class AiModule { }
