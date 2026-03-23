import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends PassportAuthGuard('jwt') {
  handleRequest<T>(err: Error | null, user: T | false): T {
    if (err || !user) {
      throw new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
