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
    return this.userRepo.find({ relations: ['group'] });
  }

  async createUser(data: any) {
    // Lưu ý thực tế cần hash password bằng bcrypt
    const existing = await this.userRepo.findOne({ where: { username: data.username } });
    if (existing) throw new BadRequestException('Username đã tồn tại');
    
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
    return this.groupRepo.find({ relations: ['permissions'] }); // Lấy kèm quyền
  }

  async createGroup(data: any) {
    const group = this.groupRepo.create({
        name: data.name,
        description: data.description
    });
    const savedGroup = await this.groupRepo.save(group);

    // Tạo permissions mặc định (nếu có gửi kèm)
    if (data.permissions && Array.isArray(data.permissions)) {
        const perms = data.permissions.map((p: any) => 
            this.permRepo.create({ ...p, group_id: savedGroup.id })
        );
        await this.permRepo.save(perms);
    }
    return savedGroup;
  }

  async updateGroupPermissions(groupId: number, permissions: any[]) {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    // Xóa quyền cũ, tạo quyền mới (Cách đơn giản nhất để update)
    await this.permRepo.delete({ group_id: groupId });
    
    const newPerms = permissions.map(p => this.permRepo.create({ ...p, group_id: groupId }));
    return this.permRepo.save(newPerms);
  }
}