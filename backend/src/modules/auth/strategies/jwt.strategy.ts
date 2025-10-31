// backend/src/modules/auth/strategies/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

interface JwtPayload {
  sub: string; // ← This is the user ID!
  email: string;
  username: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-fallback-secret-key',
    });
  }

  async validate(payload: JwtPayload) {
    console.log('🔑 JWT Payload received:', payload);
    
    // ✅ CRITICAL: Map `sub` to `id` so controllers can access req.user.id
    return {
      id: payload.sub, // ← Add this line!
      userId: payload.sub, // ← Keep for backward compatibility
      email: payload.email,
      username: payload.username,
      iat: payload.iat,
      exp: payload.exp,
    };
  }
}
