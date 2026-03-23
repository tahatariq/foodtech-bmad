import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { DRIZZLE } from '../../database/database.provider';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<UsersService>;
  let jwtService: Partial<JwtService>;
  let mockDb: Record<string, jest.Mock>;

  const testPasswordHash = bcrypt.hashSync('Password123!', 12);

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    password_hash: testPasswordHash,
    display_name: 'Test User',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    staffRoles: [
      {
        id: 'staff-1',
        user_id: 'user-1',
        tenant_id: 'tenant-1',
        role: 'head_chef',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ],
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
      verify: jest.fn(),
    };

    // Mock the Drizzle db chain
    const limitFn = jest.fn().mockResolvedValue([]);
    const whereFn = jest.fn().mockReturnValue({ limit: limitFn });
    const fromFn = jest.fn().mockReturnValue({ where: whereFn });
    const selectFn = jest.fn().mockReturnValue({ from: fromFn });
    const setFn = jest
      .fn()
      .mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) });
    const valuesFn = jest.fn().mockResolvedValue(undefined);

    mockDb = {
      select: selectFn,
      insert: jest.fn().mockReturnValue({ values: valuesFn }),
      update: jest.fn().mockReturnValue({ set: setFn }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: { get: () => 'test-secret' } },
        { provide: DRIZZLE, useValue: mockDb },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should return token pair for valid credentials', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.login(
        'test@example.com',
        'Password123!',
      );
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException for non-existent email', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.login('nonexistent@example.com', 'Password123!'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        authService.login('test@example.com', 'WrongPassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for user with no staff roles', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue({
        ...mockUser,
        staffRoles: [],
      });

      await expect(
        authService.login('test@example.com', 'Password123!'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should use same error message for invalid email and password', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      try {
        await authService.login('wrong@example.com', 'Password123!');
      } catch (e) {
        expect((e as UnauthorizedException).message).toBe(
          'Invalid email or password',
        );
      }

      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      try {
        await authService.login('test@example.com', 'WrongPassword');
      } catch (e) {
        expect((e as UnauthorizedException).message).toBe(
          'Invalid email or password',
        );
      }
    });
  });

  describe('validateUser', () => {
    it('should return user data for valid access token payload', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue({
        id: 'user-1',
        is_active: true,
      });

      const result = await authService.validateUser({
        userId: 'user-1',
        tenantId: 'tenant-1',
        role: 'head_chef',
        email: 'test@example.com',
        type: 'access',
      });

      expect(result).toEqual({
        userId: 'user-1',
        tenantId: 'tenant-1',
        role: 'head_chef',
        email: 'test@example.com',
      });
    });

    it('should return null for inactive user', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue({
        id: 'user-1',
        is_active: false,
      });

      const result = await authService.validateUser({
        userId: 'user-1',
        tenantId: 'tenant-1',
        role: 'head_chef',
        email: 'test@example.com',
        type: 'access',
      });

      expect(result).toBeNull();
    });

    it('should return null for non-access token type', async () => {
      const result = await authService.validateUser({
        userId: 'user-1',
        tenantId: 'tenant-1',
        role: 'head_chef',
        email: 'test@example.com',
        type: 'refresh' as 'access',
      });

      expect(result).toBeNull();
    });
  });
});
