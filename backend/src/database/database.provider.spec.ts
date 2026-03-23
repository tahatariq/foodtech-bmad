import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database.module';

describe('DatabaseModule', () => {
  it('should provide DRIZZLE token', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              DATABASE_URL:
                'postgresql://foodtech:foodtech@localhost:5432/foodtech',
            }),
          ],
        }),
        DatabaseModule,
      ],
    }).compile();

    const drizzle = module.get('DRIZZLE');
    expect(drizzle).toBeDefined();
    await module.close();
  });
});
