import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
  ) {}

  async create(data: any) {
    // Check trùng mã
    const existing = await this.customerRepo.findOne({ where: { code: data.code } });
    if (existing) throw new BadRequestException('Mã khách hàng đã tồn tại: ' + data.code);

    const customer = this.customerRepo.create(data);
    return this.customerRepo.save(customer);
  }

  async findAll() {
    return this.customerRepo.find({ order: { id: 'DESC' } });
  }

  async findOne(id: number) {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('Khách hàng không tồn tại');
    return customer;
  }

  async update(id: number, data: any) {
    await this.findOne(id); // Check tồn tại
    await this.customerRepo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    const customer = await this.findOne(id);
    // TODO: Sau này cần check xem KH đã có đơn hàng chưa mới cho xóa
    return this.customerRepo.remove(customer);
  }
}