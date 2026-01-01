import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ProductsModule } from '../products/products.module';
import { FinanceModule } from '../finance/finance.module';
import { SalesModule } from '../sales/sales.module';
import { CustomersModule } from '../customers/customers.module';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Factory provider for Gemini
const GeminiProvider = {
    provide: 'GEMINI_MODEL',
    useFactory: () => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn('GEMINI_API_KEY is not set. AI features may not work.');
            return null;
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        return genAI.getGenerativeModel({ model: 'gemini-pro' });
    }
};

@Module({
    imports: [
        ProductsModule,
        FinanceModule,
        SalesModule,
        CustomersModule
    ],
    controllers: [AiController],
    providers: [AiService, GeminiProvider],
})
export class AiModule { }
