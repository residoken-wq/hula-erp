import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Process } from './process.entity';

@Injectable()
export class ProcessesService {
  constructor(@InjectRepository(Process) private repo: Repository<Process>) {}

  async findAll() { return this.repo.find(); }
  async create(data: any) { return this.repo.save(data); }
  
  // Seed data mẫu nếu chưa có
  async seed() {
      const count = await this.repo.count();
      if(count === 0) {
          await this.repo.save([
              { code: 'P_CAT', name: 'Gia công Cắt', unit: 'Bàn', standard_cost: 50000 },
              { code: 'P_MAY', name: 'Gia công May', unit: 'Cái', standard_cost: 15000 },
              { code: 'P_UI', name: 'Gia công Ủi/Đóng gói', unit: 'Cái', standard_cost: 2000 },
              { code: 'P_THEU', name: 'Gia công Thêu', unit: 'Hình', standard_cost: 5000 },
          ]);
      }
  }
}