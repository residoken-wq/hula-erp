import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserGroup } from './entities/user-group.entity';
import { GroupPermission } from './entities/group-permission.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(UserGroup) private groupRepo: Repository<UserGroup>,
    @InjectRepository(GroupPermission) private permRepo: Repository<GroupPermission>,
  ) {}

  // --- USER MANAGEMENT ---
  async getAllUsers() {
    return this.userRepo.find({ relations: ['group'], order: { id: 'DESC' } });
  }

  async createUser(data: any) {
    const existing = await this.userRepo.findOne({ where: { username: data.username } });
    if (existing) throw new BadRequestException('Tên đăng nhập đã tồn tại');
    
    // Lưu ý: Thực tế cần mã hóa password (bcrypt)
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  async updateUser(id: number, data: any) {
    await this.userRepo.update(id, data);
    return this.userRepo.findOne({ where: { id }, relations: ['group'] });
  }

  async deleteUser(id: number) {
    return this.userRepo.delete(id);
  }

  // --- GROUP & PERMISSION MANAGEMENT ---
  async getAllGroups() {
    return this.groupRepo.find({ order: { id: 'ASC' }, relations: ['permissions'] });
  }

  async getGroupDetail(id: number) {
      return this.groupRepo.findOne({ where: { id }, relations: ['permissions'] });
  }

  async createGroup(data: any) {
    const group = this.groupRepo.create({ name: data.name, description: data.description });
    const saved = await this.groupRepo.save(group);
    
    // FIX TS2769: Map dữ liệu trước, sau đó create batch
    if (data.permissions && data.permissions.length > 0) {
        const permObjects = data.permissions.map((p: any) => ({
            ...p,
            group_id: saved.id 
        }));
        
        // Create nhận vào mảng object và trả về mảng Entity -> Đúng kiểu cho save()
        const perms = this.permRepo.create(permObjects);
        await this.permRepo.save(perms);
    }
    return saved;
  }

  async updateGroupPermissions(groupId: number, data: any) {
      const group = await this.groupRepo.findOne({ where: { id: groupId } });
      if (!group) throw new NotFoundException('Không tìm thấy nhóm');

      // Update thông tin cơ bản
      if (data.name) await this.groupRepo.update(groupId, { name: data.name, description: data.description });

      // Update permissions: Xóa cũ -> Thêm mới (Batch Insert)
      if (data.permissions) {
          await this.permRepo.delete({ group_id: groupId });
          
          // FIX TS2769: Xử lý tương tự hàm createGroup
          const permObjects = data.permissions.map((p: any) => ({
              ...p,
              group_id: groupId 
          }));

          const perms = this.permRepo.create(permObjects);
          await this.permRepo.save(perms);
      }
      return { success: true };
  }
}