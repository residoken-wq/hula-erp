import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ProductsModule } from '../products/products.module';
import { FinanceModule } from '../finance/finance.module';
import { SalesModule } from '../sales/sales.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
    imports: [
        ProductsModule,
        FinanceModule,
        SalesModule,
        CustomersModule
    ],
    controllers: [AiController],
    providers: [AiService],
})
export class AiModule { }
