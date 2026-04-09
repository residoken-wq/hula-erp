import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { InventorySamplesService } from './inventory-samples.service';
import { SampleTransactionType } from './sample-transaction.entity';

@Controller('inventory/samples')
export class InventorySamplesController {
    constructor(private readonly samplesService: InventorySamplesService) {}

    @Get('transactions')
    async getTransactions() {
        return this.samplesService.getTransactions();
    }

    @Post('transactions')
    async createTransaction(@Body() body: {
        type: SampleTransactionType;
        reference_type?: string;
        reference_id?: number;
        note?: string;
        created_by?: string;
        items: { product_id: number; quantity: number; note?: string }[];
    }) {
        return this.samplesService.createTransaction(body);
    }

    @Get('transactions/:id')
    async getTransaction(@Param('id') id: string) {
        return this.samplesService.getTransaction(Number(id));
    }

    @Post('transactions/:id/confirm')
    async confirmTransaction(@Param('id') id: string) {
        return this.samplesService.confirmTransaction(Number(id));
    }

    @Delete('transactions/:id')
    async deleteTransaction(@Param('id') id: string) {
        return this.samplesService.deleteTransaction(Number(id));
    }

    @Get('stocks')
    async getStocks() {
        return this.samplesService.getSampleStocks();
    }
}
