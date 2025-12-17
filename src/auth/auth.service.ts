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
    const user = await this.usersService.findOneByUsernameForAuth(username); 
    
    if (user) {
        const isMatch = (pass === user.password) || (await bcrypt.compare(pass, user.password));
        if (isMatch) {
            const { password, ...result } = user;
            return result;
        }
    }
    return null;
  }

  async login(user: any) {
    // Lưu ý: user ở đây là kết quả từ validateUser (đã bao gồm group và permissions)
    const payload = { username: user.username, sub: user.id, group_id: user.group?.id };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          group_id: user.group?.id,
          role_name: user.group?.name,
          // --- QUAN TRỌNG: TRẢ VỀ DANH SÁCH QUYỀN ---
          permissions: user.group?.permissions || [] 
          // -------------------------------------------
      }
    };
  }
}