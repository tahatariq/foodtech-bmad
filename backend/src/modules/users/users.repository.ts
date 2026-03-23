import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../../database/database.provider';
import { users } from '../../database/schema/users.schema';
import { staff } from '../../database/schema/staff.schema';

@Injectable()
export class UsersRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findByEmail(email: string) {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return result[0] ?? null;
  }

  async findById(userId: string) {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return result[0] ?? null;
  }

  async findStaffRoles(userId: string) {
    return this.db.select().from(staff).where(eq(staff.user_id, userId));
  }
}
