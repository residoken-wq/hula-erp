import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer, CustomerType } from './customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
  ) {}

  async create(data: any) {
    const existing = await this.customerRepo.findOne({ where: { code: data.code } });
    if (existing) throw new BadRequestException('Mã đã tồn tại');

    const customer = this.customerRepo.create({
        ...data,
        type: data.type || CustomerType.LEAD, // Mặc định là Lead
        history: [],
        credit_limit: Number(data.credit_limit) || 0,
        current_debt: 0
    });
    return this.customerRepo.save(customer);
  }

  async findAll() { return this.customerRepo.find({ order: { id: 'DESC' } }); }
  
  async findOne(id: number) { return this.customerRepo.findOne({ where: { id } }); }

  async update(id: number, data: any) {
    await this.customerRepo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) { return this.customerRepo.delete(id); }

  // --- API MỚI: FOLLOW LEAD ---
  async addHistory(id: number, note: string) {
      const customer = await this.findOne(id);
      const newLog = {
          date: new Date(),
          note: note,
          user: 'Admin' // Sau này lấy từ Token
      };
      // PostgreSQL jsonb array append
      if(!customer.history) customer.history = [];
      customer.history.unshift(newLog); // Thêm vào đầu danh sách
      return this.customerRepo.save(customer);
  }
  
  // Convert Lead -> Customer (Khi chốt đơn)
  async convertToCustomer(id: number) {
      return this.customerRepo.update(id, { type: CustomerType.CUSTOMER });
  }
}