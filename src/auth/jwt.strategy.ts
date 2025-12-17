import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'HULA_SECRET_KEY', // Thực tế nên để trong .env
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username, groupId: payload.group_id };
  }
}