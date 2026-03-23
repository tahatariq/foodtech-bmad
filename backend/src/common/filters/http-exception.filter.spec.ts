import {
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockGetResponse: jest.Mock;
  let mockGetRequest: jest.Mock;
  let mockHost: any;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
    mockGetRequest = jest.fn().mockReturnValue({ url: '/api/v1/auth/login' });
    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: mockGetResponse,
        getRequest: mockGetRequest,
      }),
    };
  });

  it('should format 401 as RFC 7807 Problem Detail', () => {
    const exception = new UnauthorizedException('Invalid credentials');
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(mockJson).toHaveBeenCalledWith({
      type: 'https://foodtech.app/errors/unauthorized',
      title: 'Unauthorized',
      status: 401,
      detail: 'Invalid email or password',
      instance: '/api/v1/auth/login',
    });
  });

  it('should not leak specific error details for 401', () => {
    const exception = new UnauthorizedException('User admin@demo.com not found');
    filter.catch(exception, mockHost);

    const response = mockJson.mock.calls[0][0];
    expect(response.detail).toBe('Invalid email or password');
    expect(response.detail).not.toContain('admin@demo.com');
  });

  it('should format 404 as RFC 7807', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
    filter.catch(exception, mockHost);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'https://foodtech.app/errors/not-found',
        title: 'Not Found',
        status: 404,
      }),
    );
  });
});
