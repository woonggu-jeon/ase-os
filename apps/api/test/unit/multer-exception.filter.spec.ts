import type { ArgumentsHost } from '@nestjs/common';
import { MulterError } from 'multer';
import { MulterExceptionFilter } from '../../src/interface/http/multer-exception.filter';

function hostWithResponse() {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  const host = {
    switchToHttp: () => ({ getResponse: () => res }),
  } as unknown as ArgumentsHost;
  return { host, res };
}

describe('MulterExceptionFilter', () => {
  it('maps LIMIT_FILE_SIZE to 413', () => {
    const { host, res } = hostWithResponse();
    new MulterExceptionFilter().catch(new MulterError('LIMIT_FILE_SIZE'), host);
    expect(res.status).toHaveBeenCalledWith(413);
  });

  it('maps other multer errors to 400', () => {
    const { host, res } = hostWithResponse();
    new MulterExceptionFilter().catch(new MulterError('LIMIT_UNEXPECTED_FILE'), host);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
