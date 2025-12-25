import { Controller, Post, Get, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { SalesService } from './sales.service';

@Controller('sales')
export class SalesController {
    constructor(private readonly s: SalesService) { }

    // ============================================================
    // 1. CÁC API TĨNH (STATIC ROUTES) - ĐẶT LÊN ĐẦU ĐỂ TRÁNH CONFLICT
    // ============================================================

    @Post('price-lists')
    createPriceList(@Body() body: any) { return this.s.createPriceList(body); }

    @Get('price-lists')
    getAllPriceLists() { return this.s.getAllPriceLists(); }

    @Post('price-lists/:id/rules')
    createRule(@Param('id') id: number, @Body() body: any) { return this.s.createPriceListRule(id, body); }

    @Get('price-lists/:id/rules')
    getRules(@Param('id') id: number) { return this.s.getPriceListRules(id); }

    @Get('validate-price')
    async validatePrice(@Query('sku') sku: string, @Query('unitPrice') unitPrice: number, @Query('userId') userId: number) {
        return this.s.validatePriceAgainstPriceList(sku, Number(unitPrice), Number(userId));
    }

    @Get('samples/all')
    getAllSamples() { return this.s.sampleRepo.find({ order: { created_at: 'DESC' } }); }

    // ============================================================
    // 2. CÁC API CON (SUB-RESOURCES)
    // ============================================================

    @Get(':id/comments')
    getComments(@Param('id') id: number) { return this.s.getComments(id); }

    @Post(':id/comment')
    addComment(@Param('id') id: number, @Body() body: any) { return this.s.addComment(id, body.content, body.sender, body.name); }

    @Post('comment/:id/toggle')
    toggleComment(@Param('id') id: number) { return this.s.toggleCommentVisibility(id); }

    @Get(':id/deliveries')
    getDeliveries(@Param('id') id: number) { return this.s.getDeliveryHistory(id); }

    @Post(':id/delivery')
    createDelivery(@Param('id') id: number, @Body() b: any) { return this.s.createDelivery(id, b); }

    @Get(':code/payments')
    getPayments(@Param('code') code: string) { return this.s.getPaymentHistory(code); }

    @Get(':code/payment-history')
    getPaymentHistory(@Param('code') code: string) { return this.s.getPaymentHistory(code); }

    // Portal APIs
    @Get('portal/:uuid') getPortal(@Param('uuid') uuid: string) { return this.s.getQuoteByUuid(uuid); }
    @Post('portal/:uuid/action') customerAction(@Param('uuid') uuid: string, @Body() body: any) { return this.s.customerAction(uuid, body.action); }

    // ============================================================
    // 3. API ĐƠN HÀNG (DYNAMIC ROUTES)
    // ============================================================

    @Post()
    create(@Body() b: any) { return this.s.createOrder(b); }

    @Get()
    findAll() { return this.s.findAll(); }

    // --- QUAN TRỌNG: FIX LỖI 500 ---
    // Dùng chung 1 API để tìm theo ID hoặc CODE
    @Get(':idOrCode')
    findOne(@Param('idOrCode') idOrCode: string) {
        console.log('--- GET /sales/:idOrCode ---', idOrCode); // Debug
        return this.s.findOne(idOrCode);
    }

    // --- QUAN TRỌNG: FIX LỖI 404 CANNOT PUT ---
    @Put(':id')
    update(@Param('id') id: number, @Body() b: any) {
        return this.s.update(Number(id), b);
    }
    // ------------------------------------------

    @Post(':id/convert')
    convert(@Param('id') id: number, @Body('accepted') accepted: boolean) { return this.s.convertQuoteToSo(id, accepted); }

    @Put('quote/:id')
    updateQuote(@Param('id') id: number, @Body() b: any) { return this.s.updateQuote(id, b); }

    @Delete('quote/:id')
    deleteQuote(@Param('id') id: number) { return this.s.deleteQuote(id); }

    @Post(':id/approve-samples')
    approveSamples(@Param('id') id: number) { return this.s.approveAllSamples(id); }

    @Post(':id/complete')
    complete(@Param('id') id: number) { return this.s.completeOrder(id); }

    @Post(':id/cancel')
    cancel(@Param('id') id: number, @Body('reason') reason: string) { return this.s.cancelOrder(id, reason); }

    // --- REVISIONS ---
    @Post(':id/revision')
    createRevision(@Param('id') id: number, @Body() body: any) {
        return this.s.createRevision(id, body.userId, body.username);
    }

    @Get(':id/revisions')
    getRevisions(@Param('id') id: number) { return this.s.getRevisions(id); }
}