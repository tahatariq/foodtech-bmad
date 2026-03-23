import { SetMetadata } from '@nestjs/common';
import { StaffRoleType } from '../constants/roles';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: StaffRoleType[]) =>
  SetMetadata(ROLES_KEY, roles);
