import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const problemDetail = {
      type: this.getErrorType(status),
      title: this.getTitle(status),
      status,
      detail: this.getSafeDetail(exception, status),
      instance: request.url,
    };

    response.status(status).json(problemDetail);
  }

  private getErrorType(status: number): string {
    const types: Record<number, string> = {
      [HttpStatus.UNAUTHORIZED]: 'https://foodtech.app/errors/unauthorized',
      [HttpStatus.FORBIDDEN]: 'https://foodtech.app/errors/forbidden',
      [HttpStatus.NOT_FOUND]: 'https://foodtech.app/errors/not-found',
      [HttpStatus.BAD_REQUEST]: 'https://foodtech.app/errors/bad-request',
      [HttpStatus.CONFLICT]: 'https://foodtech.app/errors/conflict',
      [HttpStatus.UNPROCESSABLE_ENTITY]:
        'https://foodtech.app/errors/validation-error',
    };
    return types[status] ?? 'https://foodtech.app/errors/internal';
  }

  private getTitle(status: number): string {
    const titles: Record<number, string> = {
      [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
      [HttpStatus.FORBIDDEN]: 'Forbidden',
      [HttpStatus.NOT_FOUND]: 'Not Found',
      [HttpStatus.BAD_REQUEST]: 'Bad Request',
      [HttpStatus.CONFLICT]: 'Conflict',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'Validation Error',
    };
    return titles[status] ?? 'Internal Server Error';
  }

  private getSafeDetail(exception: HttpException, status: number): string {
    if (status === (HttpStatus.UNAUTHORIZED as number)) {
      return 'Invalid email or password';
    }
    const response = exception.getResponse();
    if (typeof response === 'string') return response;
    if (typeof response === 'object' && 'message' in response) {
      const msg = (response as Record<string, unknown>).message;
      return Array.isArray(msg) ? msg.join(', ') : String(msg);
    }
    return 'An error occurred';
  }
}
