import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    // Tìm user kèm password (cần viết thêm hàm này bên UsersService nếu chưa có, hoặc dùng findOne)
    // Lưu ý: Ở bước trước User entity set select: false cho password, nên cần queryBuilder hoặc addSelect
    const user = await this.usersService.findOneByUsernameForAuth(username); 
    
    if (user) {
        // So sánh password (giả sử password lưu DB chưa mã hóa hoặc đã mã hóa bcrypt)
        // Code demo này chấp nhận cả 2 trường hợp để bạn dễ test
        const isMatch = (pass === user.password) || (await bcrypt.compare(pass, user.password));
        if (isMatch) {
            const { password, ...result } = user;
            return result;
        }
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id, group_id: user.group_id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          group_id: user.group_id // Trả về để frontend lưu
      }
    };
  }
}