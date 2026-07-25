import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { MulterError } from 'multer';
import type { Response } from 'express';

/** Map multer upload errors to meaningful HTTP responses instead of a generic 500. */
@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(err: MulterError, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const tooLarge = err.code === 'LIMIT_FILE_SIZE';
    const status = tooLarge ? HttpStatus.PAYLOAD_TOO_LARGE : HttpStatus.BAD_REQUEST;
    res.status(status).json({
      statusCode: status,
      message: tooLarge
        ? 'Video exceeds the 500MB upload limit'
        : `Upload error: ${err.message}`,
    });
  }
}
