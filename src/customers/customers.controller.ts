import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly s: CustomersService) { }

  @Post() create(@Body() b: any) { return this.s.create(b); }
  @Get() findAll() { return this.s.findAll(); }
  @Get(':id') findOne(@Param('id') id: number) { return this.s.findOne(id); }
  @Put(':id') update(@Param('id') id: number, @Body() b: any) { return this.s.update(id, b); }
  @Delete(':id') remove(@Param('id') id: number) { return this.s.remove(id); }

  @Post(':id/follow')
  addHistory(@Param('id') id: number, @Body('note') note: string) {
    return this.s.addHistory(id, note);
  }

  @Get(':id/orders')
  getOrders(@Param('id') id: number) {
    return this.s.getOrders(id);
  }

  @Put(':id/bod-follow-up')
  updateBodFollowUp(@Param('id') id: number, @Body() b: any) {
    return this.s.updateBodFollowUp(id, b);
  }

  // --- LEAD CARE: COMMENTS ---
  @Get(':id/comments')
  getComments(@Param('id') id: number) {
    return this.s.getComments(id);
  }

  @Post(':id/comment')
  addComment(@Param('id') id: number, @Body() body: any) {
    return this.s.addComment(id, body.content, body.sender, body.name, body.comment_type, body.mentioned_user_ids);
  }
}