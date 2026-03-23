import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { organizations } from '../schema/organizations.schema';
import { locations } from '../schema/locations.schema';
import { users } from '../schema/users.schema';
import { staff } from '../schema/staff.schema';

const DEFAULT_PASSWORD = 'Password123!';
const BCRYPT_ROUNDS = 12;

async function seed() {
  const connectionString =
    process.env.DATABASE_URL ??
    'postgresql://foodtech:foodtech@localhost:5432/foodtech';

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  console.log('Seeding database...');

  // Organization
  const orgId = '00000000-0000-4000-a000-000000000001';
  const existingOrg = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId));

  if (existingOrg.length === 0) {
    await db.insert(organizations).values({
      id: orgId,
      name: 'Demo Restaurant Group',
      slug: 'demo-restaurant-group',
      subscription_tier: 'growth',
    });
    console.log('  Created organization: Demo Restaurant Group');
  } else {
    console.log('  Organization already exists, skipping');
  }

  // Locations
  const downtownId = '00000000-0000-4000-a000-000000000010';
  const airportId = '00000000-0000-4000-a000-000000000011';

  const existingLocations = await db
    .select()
    .from(locations)
    .where(eq(locations.organization_id, orgId));

  if (existingLocations.length === 0) {
    await db.insert(locations).values([
      {
        id: downtownId,
        organization_id: orgId,
        name: 'Downtown Kitchen',
        address: '123 Main St, Downtown',
        timezone: 'America/New_York',
      },
      {
        id: airportId,
        organization_id: orgId,
        name: 'Airport Express',
        address: '1 Terminal Rd, Airport',
        timezone: 'America/New_York',
      },
    ]);
    console.log('  Created locations: Downtown Kitchen, Airport Express');
  } else {
    console.log('  Locations already exist, skipping');
  }

  // Users
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_ROUNDS);

  const seedUsers = [
    {
      id: '00000000-0000-4000-a000-000000000100',
      email: 'admin@demo.com',
      display_name: 'Admin User',
    },
    {
      id: '00000000-0000-4000-a000-000000000101',
      email: 'chef@downtown.com',
      display_name: 'Head Chef',
    },
    {
      id: '00000000-0000-4000-a000-000000000102',
      email: 'cook@downtown.com',
      display_name: 'Line Cook',
    },
    {
      id: '00000000-0000-4000-a000-000000000103',
      email: 'manager@airport.com',
      display_name: 'Airport Manager',
    },
  ];

  for (const u of seedUsers) {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, u.email));
    if (existing.length === 0) {
      await db.insert(users).values({ ...u, password_hash: passwordHash });
      console.log(`  Created user: ${u.email}`);
    } else {
      console.log(`  User ${u.email} already exists, skipping`);
    }
  }

  // Staff assignments
  const staffAssignments = [
    {
      user_id: seedUsers[0].id,
      tenant_id: downtownId,
      role: 'org_owner' as const,
    },
    {
      user_id: seedUsers[0].id,
      tenant_id: airportId,
      role: 'org_owner' as const,
    },
    {
      user_id: seedUsers[1].id,
      tenant_id: downtownId,
      role: 'head_chef' as const,
    },
    {
      user_id: seedUsers[2].id,
      tenant_id: downtownId,
      role: 'line_cook' as const,
    },
    {
      user_id: seedUsers[3].id,
      tenant_id: airportId,
      role: 'location_manager' as const,
    },
  ];

  for (const s of staffAssignments) {
    const existing = await db
      .select()
      .from(staff)
      .where(eq(staff.user_id, s.user_id));
    const hasAssignment = existing.some((e) => e.tenant_id === s.tenant_id);
    if (!hasAssignment) {
      await db.insert(staff).values(s);
      console.log(
        `  Created staff: ${s.role} at ${s.tenant_id === downtownId ? 'Downtown' : 'Airport'}`,
      );
    } else {
      console.log(`  Staff assignment already exists, skipping`);
    }
  }

  console.log('Seed complete!');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
