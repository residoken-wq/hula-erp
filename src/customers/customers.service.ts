import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer, CustomerType } from './customer.entity';
import { CustomerContact } from './customer-contact.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(CustomerContact) private contactRepo: Repository<CustomerContact>,
  ) {}

  async create(data: any) {
    const existing = await this.customerRepo.findOne({ where: { code: data.code } });
    if (existing) throw new BadRequestException('Mã khách hàng đã tồn tại');

    // Xu ly parent
    let parent = null;
    if (data.parent_id) {
        parent = await this.customerRepo.findOne({ where: { id: data.parent_id } });
    }

    const customer = this.customerRepo.create({
        ...data,
        type: data.type || CustomerType.LEAD,
        credit_limit: Number(data.credit_limit) || 0,
        current_debt: 0,
        parent: parent,
        // Contacts se duoc luu tu dong nho cascade: true
        contacts: data.contacts?.map((c: any) => this.contactRepo.create(c)) || []
    });
    return this.customerRepo.save(customer);
  }

  async findAll() {
    return this.customerRepo.find({ 
        order: { id: 'DESC' },
        relations: ['parent', 'contacts'] // Load them thong tin Cha va Contact
    }); 
  }
  
  async findOne(id: number) { 
      return this.customerRepo.findOne({ 
          where: { id },
          relations: ['parent', 'children', 'contacts'] // Load chi tiet
      }); 
  }

  async update(id: number, data: any) {
    const customer = await this.findOne(id);
    if(!customer) throw new NotFoundException();

    // 1. Update thong tin co ban
    const { contacts, parent_id, ...info } = data;
    
    // 2. Xu ly Parent
    if (parent_id) {
        if (parent_id === id) throw new BadRequestException('Khong the chon chinh minh lam cha');
        customer.parent = await this.customerRepo.findOne({ where: { id: parent_id } });
    } else {
        customer.parent = null;
    }

    // 3. Xu ly Contacts (Xoa cu tao moi cho don gian, hoac update tung dong)
    // O day dung chien thuat xoa het contact cu cua customer nay roi insert lai
    if (contacts && Array.isArray(contacts)) {
        await this.contactRepo.delete({ customer: { id } });
        customer.contacts = contacts.map(c => this.contactRepo.create(c));
    }

    Object.assign(customer, info);
    return this.customerRepo.save(customer);
  }

  async remove(id: number) { return this.customerRepo.delete(id); }

  async addHistory(id: number, note: string) {
      const customer = await this.findOne(id);
      const newLog = { date: new Date(), note: note, user: 'Admin' };
      if(!customer.history) customer.history = [];
      customer.history.unshift(newLog);
      return this.customerRepo.save(customer);
  }
  
  async convertToCustomer(id: number) {
      return this.customerRepo.update(id, { type: CustomerType.CUSTOMER });
  }
}