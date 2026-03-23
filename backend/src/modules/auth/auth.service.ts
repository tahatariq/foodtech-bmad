import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { UsersService } from '../users/users.service';
import { DRIZZLE, DrizzleDB } from '../../database/database.provider';
import { refreshTokens } from '../../database/schema/refresh-tokens.schema';
import { users as usersTable } from '../../database/schema/users.schema';

interface AccessTokenPayload {
  userId: string;
  tenantId: string;
  role: string;
  email: string;
  type: 'access';
}

interface RefreshTokenPayload {
  userId: string;
  type: 'refresh';
  tokenId: string;
}

@Injectable()
export class AuthService {
  private readonly jwtRefreshSecret: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
  ) {
    this.jwtRefreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      'refresh-secret-dev';
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.staffRoles || user.staffRoles.length === 0) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const primaryStaff = user.staffRoles[0];

    return this.generateTokenPair(
      user.id,
      primaryStaff.tenant_id,
      primaryStaff.role,
      user.email,
    );
  }

  async refresh(refreshToken: string) {
    let payload: RefreshTokenPayload;
    try {
      payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken, {
        secret: this.jwtRefreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const storedTokens = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.id, payload.tokenId))
      .limit(1);

    const storedToken = storedTokens[0];
    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.is_revoked) {
      // Token reuse detected — revoke all tokens for this user
      await this.db
        .update(refreshTokens)
        .set({ is_revoked: true })
        .where(eq(refreshTokens.user_id, payload.userId));
      throw new UnauthorizedException('Token reuse detected');
    }

    if (new Date() > storedToken.expires_at) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Revoke old token
    await this.db
      .update(refreshTokens)
      .set({ is_revoked: true })
      .where(eq(refreshTokens.id, payload.tokenId));

    // Get user info for new tokens
    const userRecords = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, payload.userId))
      .limit(1);

    const userRecord = userRecords[0];
    if (!userRecord) {
      throw new UnauthorizedException('User not found');
    }

    const user = await this.usersService.findByEmail(userRecord.email);
    if (!user || !user.staffRoles?.length) {
      throw new UnauthorizedException('User not found');
    }

    const primaryStaff = user.staffRoles[0];
    return this.generateTokenPair(
      user.id,
      primaryStaff.tenant_id,
      primaryStaff.role,
      user.email,
    );
  }

  async revokeRefreshToken(tokenId: string) {
    await this.db
      .update(refreshTokens)
      .set({ is_revoked: true })
      .where(eq(refreshTokens.id, tokenId));
  }

  async validateUser(payload: AccessTokenPayload) {
    if (payload.type !== 'access') return null;
    const user = await this.usersService.findById(payload.userId);
    if (!user || !user.is_active) return null;
    return {
      userId: payload.userId,
      tenantId: payload.tenantId,
      role: payload.role,
      email: payload.email,
    };
  }

  private async generateTokenPair(
    userId: string,
    tenantId: string,
    role: string,
    email: string,
  ) {
    const tokenId = crypto.randomUUID();

    const accessPayload: AccessTokenPayload = {
      userId,
      tenantId,
      role,
      email,
      type: 'access',
    };

    const refreshPayload: RefreshTokenPayload = {
      userId,
      type: 'refresh',
      tokenId,
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: '15m',
    });

    const refreshTokenValue = this.jwtService.sign(refreshPayload, {
      secret: this.jwtRefreshSecret,
      expiresIn: '7d',
    });

    // Store refresh token hash
    const tokenHash = await bcrypt.hash(refreshTokenValue, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.db.insert(refreshTokens).values({
      id: tokenId,
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    return { accessToken, refreshToken: refreshTokenValue };
  }
}
