import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });

  let pipe: ZodValidationPipe;

  beforeEach(() => {
    pipe = new ZodValidationPipe(schema);
  });

  it('should pass valid input through', () => {
    const input = { email: 'test@example.com', password: 'Password123!' };
    expect(pipe.transform(input)).toEqual(input);
  });

  it('should throw BadRequestException for invalid input', () => {
    expect(() => pipe.transform({ email: 'invalid', password: '123' })).toThrow(
      BadRequestException,
    );
  });

  it('should include error details in exception', () => {
    try {
      pipe.transform({ email: 'invalid', password: '123' });
    } catch (e) {
      const response = (e as BadRequestException).getResponse();
      expect(response).toHaveProperty('message', 'Validation failed');
      expect(response).toHaveProperty('errors');
    }
  });

  it('should strip unknown fields', () => {
    const input = {
      email: 'test@example.com',
      password: 'Password123!',
      extra: 'field',
    };
    const result = pipe.transform(input);
    expect(result).not.toHaveProperty('extra');
  });
});
