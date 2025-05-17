import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { SELF } from 'cloudflare:test';
import { app } from '../shortener';

// Type for successful response
type SuccessResponse<T> = {
  success: true;
  data: T;
  error?: never;
  errors?: never;
};

// Type for error response
type ErrorResponse = {
  success: false;
  error: string;
  errors?: Record<string, string>;
  data?: never;
};

type TestResponse<T> = SuccessResponse<T> | ErrorResponse;

// Type declarations
declare global {
  // eslint-disable-next-line no-var
  var SHORT_URLS: KVNamespace;
  // eslint-disable-next-line no-var
  var BASE_URL: string;
}

// Test configuration

// Response data type
interface ShortUrlResponse {
  url: string;
  slug: string;
  shortUrl: string;
}

describe('Short URL Service', () => {
  // Test data
  const testUrl = 'https://example.com';
  const testSlug = 'test123';

  beforeAll(() => {
    // Set global BASE_URL
    globalThis.BASE_URL = 'http://localhost:8787';
  });

  afterEach(async () => {
    // Clean up KV storage after each test
    if (globalThis.SHORT_URLS) {
      const keys = await globalThis.SHORT_URLS.list();
      await Promise.all(keys.keys.map((key: { name: string }) => 
        globalThis.SHORT_URLS.delete(key.name)
      ));
    }
  });

  describe('GET /', () => {
    it('should return welcome message', async () => {
      const response = await SELF.fetch('http://localhost:8787/');
      expect(response.status).toBe(200);
      expect(await response.text()).toBe('Short URL Service API is running!');
    });
  });

  describe('POST /api/urls', () => {
    it('should create a new short URL', async () => {
      const response = await SELF.fetch('http://localhost:8787/api/urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl }),
      });

      expect(response.status).toBe(201);
      const result = await response.json() as TestResponse<ShortUrlResponse>;
      
      expect(result.success).toBe(true);
      if (result.success) {
        const { data } = result;
        expect(data).toBeDefined();
        expect(data).toHaveProperty('url', testUrl);
        expect(data).toHaveProperty('slug');
        expect(data).toHaveProperty('shortUrl');
        expect(data.shortUrl).toContain(data.slug);
        return data;
      }
      
      throw new Error('Expected success response');
    });
    
    it('should return validation error for invalid URL', async () => {
      const response = await SELF.fetch('http://localhost:8787/api/urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'invalid-url' }),
      });

      expect(response.status).toBe(400);
      const result = await response.json() as ErrorResponse;
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.errors).toBeDefined();
      if (result.errors) {
        expect(result.errors.url).toContain('Please enter a valid URL');
      }
    });
    
    it('should return error for invalid slug format', async () => {
      const response = await SELF.fetch('http://localhost:8787/api/urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: testUrl,
          slug: 'invalid slug!' // Contains space and special character
        }),
      });

      expect(response.status).toBe(400);
      const result = await response.json() as ErrorResponse;
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.errors).toBeDefined();
      if (result.errors) {
        expect(result.errors.slug).toContain('Short URL code can only contain English letters, numbers, hyphens(-) and underscores(_)');
      }
    });

    it('should create a short URL with custom slug', async () => {
      const response = await SELF.fetch('http://localhost:8787/api/urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: testUrl,
          slug: testSlug 
        }),
      });

      expect(response.status).toBe(201);
      const result = await response.json() as TestResponse<ShortUrlResponse>;
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.slug).toBe(testSlug);
        expect(result.data.shortUrl).toContain(testSlug);
      }
    });
    
    it('should return error for duplicate slug', async () => {
      // First create a URL with the test slug
      await SELF.fetch('http://localhost:8787/api/urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: testUrl,
          slug: testSlug 
        }),
      });
      
      // Try to create another URL with the same slug
      const response = await SELF.fetch('http://localhost:8787/api/urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: 'https://another-example.com',
          slug: testSlug 
        }),
      });

      expect(response.status).toBe(400);
      const result = await response.json() as ErrorResponse;
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('This short URL is already in use');
    });
  });

  describe('GET /:slug', () => {
    it('should redirect to the original URL', async () => {
      // First create a short URL
      await SELF.fetch('http://localhost:8787/api/urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: testUrl,
          slug: testSlug 
        }),
      });

      // Test redirection
      const response = await SELF.fetch(`http://localhost:8787/${testSlug}`, {
        redirect: 'manual' // Don't follow redirect
      });
      
      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe(testUrl);
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await SELF.fetch('http://localhost:8787/non-existent-slug', {
        redirect: 'manual'
      });
      
      expect(response.status).toBe(404);
    });
  });
});
