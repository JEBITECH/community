import { isPlatformDomain, createCorsOriginResolver } from '../src/cors-origin-resolver';
import { DataSource } from 'typeorm';

describe('isPlatformDomain', () => {
  describe('exact domain matches', () => {
    it('returns true for virtueinspect.com', () => {
      expect(isPlatformDomain('https://virtueinspect.com')).toBe(true);
    });

    it('returns true for localhost', () => {
      expect(isPlatformDomain('http://localhost')).toBe(true);
      expect(isPlatformDomain('http://localhost:3000')).toBe(true);
    });

    it('returns true for 127.0.0.1', () => {
      expect(isPlatformDomain('http://127.0.0.1')).toBe(true);
      expect(isPlatformDomain('http://127.0.0.1:8080')).toBe(true);
    });
  });

  describe('wildcard subdomain matching', () => {
    it('returns true for subdomains of virtueinspect.com', () => {
      expect(isPlatformDomain('https://api.virtueinspect.com')).toBe(true);
      expect(isPlatformDomain('https://admin.virtueinspect.com')).toBe(true);
      expect(isPlatformDomain('https://deep.sub.virtueinspect.com')).toBe(true);
    });

    it('returns true for the base domain itself when wildcard is present', () => {
      expect(isPlatformDomain('https://virtueinspect.com')).toBe(true);
    });
  });

  describe('non-matching origins', () => {
    it('returns false for unrecognized domains', () => {
      expect(isPlatformDomain('https://evil.com')).toBe(false);
      expect(isPlatformDomain('https://notvirtueinspect.com')).toBe(false);
    });

    it('returns false for domains that partially match but are not subdomains', () => {
      expect(isPlatformDomain('https://fakvirtueinspect.com')).toBe(false);
    });
  });

  describe('invalid URLs', () => {
    it('returns false for invalid URLs', () => {
      expect(isPlatformDomain('not-a-url')).toBe(false);
      expect(isPlatformDomain('')).toBe(false);
    });
  });
});


describe('createCorsOriginResolver', () => {
  let mockDataSource: jest.Mocked<Pick<DataSource, 'query'>>;
  let resolver: (origin: string | undefined, callback: (err: Error | null, allow?: string | boolean) => void) => void;

  beforeEach(() => {
    mockDataSource = {
      query: jest.fn(),
    };
    resolver = createCorsOriginResolver(mockDataSource as unknown as DataSource);
  });

  function callResolver(origin: string | undefined): Promise<{ err: Error | null; allow?: string | boolean }> {
    return new Promise((resolve) => {
      resolver(origin, (err, allow) => {
        resolve({ err, allow });
      });
    });
  }

  describe('no origin (server-to-server or same-origin)', () => {
    it('returns (null, true) when origin is undefined', async () => {
      const result = await callResolver(undefined);
      expect(result.err).toBeNull();
      expect(result.allow).toBe(true);
    });

    it('does not query the database when no origin is provided', async () => {
      await callResolver(undefined);
      expect(mockDataSource.query).not.toHaveBeenCalled();
    });
  });

  describe('platform domain origins', () => {
    it('returns (null, origin) for a platform subdomain', async () => {
      const origin = 'https://admin.virtueinspect.com';
      const result = await callResolver(origin);
      expect(result.err).toBeNull();
      expect(result.allow).toBe(origin);
    });

    it('returns (null, origin) for the base platform domain', async () => {
      const origin = 'https://virtueinspect.com';
      const result = await callResolver(origin);
      expect(result.err).toBeNull();
      expect(result.allow).toBe(origin);
    });

    it('returns (null, origin) for localhost', async () => {
      const origin = 'http://localhost:3000';
      const result = await callResolver(origin);
      expect(result.err).toBeNull();
      expect(result.allow).toBe(origin);
    });

    it('does not query the database for platform domains', async () => {
      await callResolver('https://admin.virtueinspect.com');
      expect(mockDataSource.query).not.toHaveBeenCalled();
    });
  });

  describe('organization allowed domain', () => {
    it('returns (null, origin) when the domain matches an org allowed_domains', async () => {
      const origin = 'https://demo.bookings-flow.com';
      mockDataSource.query.mockResolvedValue([{ id: 'org-123' }]);

      const result = await callResolver(origin);
      expect(result.err).toBeNull();
      expect(result.allow).toBe(origin);
    });

    it('queries the database with hostname and full origin', async () => {
      const origin = 'https://client-website.example.com';
      mockDataSource.query.mockResolvedValue([{ id: 'org-456' }]);

      await callResolver(origin);

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id FROM organization'),
        ['client-website.example.com', origin]
      );
    });
  });

  describe('disallowed origin', () => {
    it('returns (null, false) for an unknown domain with no matching org', async () => {
      const origin = 'https://evil-site.com';
      mockDataSource.query.mockResolvedValue([]);

      const result = await callResolver(origin);
      expect(result.err).toBeNull();
      expect(result.allow).toBe(false);
    });

    it('queries the database before rejecting', async () => {
      const origin = 'https://unknown-domain.org';
      mockDataSource.query.mockResolvedValue([]);

      await callResolver(origin);
      expect(mockDataSource.query).toHaveBeenCalled();
    });
  });
});
