import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AxiosError } from 'axios';

@Catch()
export class ExceptionFilterHandler implements ExceptionFilter {
  private readonly logger = new Logger(ExceptionFilterHandler.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else if ((exception as AxiosError).isAxiosError) {
      const axiosError = exception as AxiosError;
      status = axiosError.response?.status || HttpStatus.BAD_GATEWAY;

      const errorData = axiosError.response?.data ?? { error: 'Unknown error' };
      message =
        typeof errorData === 'object'
          ? errorData
          : { error: 'Erro ao comunicar com a Evolution API' };

      this.logger.error(
        `[Evolution API] ${axiosError.config?.url} → ${JSON.stringify(message)}`,
      );
    } else {
      message = (exception as any)?.message || message;
      this.logger.error('Erro inesperado', (exception as any)?.stack);
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
