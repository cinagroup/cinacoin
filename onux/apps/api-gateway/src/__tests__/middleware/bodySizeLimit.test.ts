import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bodySizeLimit } from '../../middleware/bodySizeLimit';

/**
 * Unit tests for body size limit middleware
 */
describe('Body Size Limit Middleware', () => {
  const mockEnv = {} as any;
  const mockNext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow requests without content-length header', async () => {
    const middleware = bodySizeLimit(1024);
    const mockContext = {
      env: mockEnv,
      req: {
        method: 'POST',
        header: vi.fn().mockReturnValue(null),
      },
    } as any;

    await middleware(mockContext, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should allow requests within size limit', async () => {
    const middleware = bodySizeLimit(1024);
    const mockContext = {
      env: mockEnv,
      req: {
        method: 'POST',
        header: vi.fn().mockReturnValue('512'),
      },
    } as any;

    await middleware(mockContext, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should reject requests exceeding size limit', async () => {
    const middleware = bodySizeLimit(1024);
    const mockContext = {
      env: mockEnv,
      req: {
        method: 'POST',
        header: vi.fn().mockReturnValue('2048'),
      },
    } as any;

    await expect(middleware(mockContext, mockNext)).rejects.toThrow('Request body too large');
  });

  it('should skip size check for GET requests', async () => {
    const middleware = bodySizeLimit(1024);
    const mockContext = {
      env: mockEnv,
      req: {
        method: 'GET',
        header: vi.fn().mockReturnValue('999999'),
      },
    } as any;

    await middleware(mockContext, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle invalid content-length values', async () => {
    const middleware = bodySizeLimit(1024);
    const mockContext = {
      env: mockEnv,
      req: {
        method: 'POST',
        header: vi.fn().mockReturnValue('invalid'),
      },
    } as any;

    await expect(middleware(mockContext, mockNext)).rejects.toThrow('Request body too large');
  });
});
