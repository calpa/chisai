import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { 
  createShortUrlSchema, 
  getUrlBySlugSchema,
  apiResponseSchema,
  type CreateShortUrlInput,
  type GetUrlBySlugInput,
  type ApiResponse
} from './types/validations';

// Generate random string
const generateRandomSlug = (length = 6): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
};

// Create standardized API response
const createApiResponse = (
  success: boolean, 
  data?: any, 
  error?: string,
  errors?: Record<string, string>
): ApiResponse => ({
  success,
  ...(data && { data }),
  ...(error && { error }),
  ...(errors && { errors })
});

export const app = new Hono<{ Bindings: CloudflareBindings }>();

// Home page
app.get('/', (c) => {
  return c.text('Short URL Service API is running!');
});

// Create short URL
app.post(
  '/api/urls',
  zValidator('json', createShortUrlSchema, (result, c) => {
    if (!result.success) {
      const errors = result.error.issues.reduce((acc, issue) => ({
        ...acc,
        [issue.path[0]]: issue.message,
      }), {});
      return c.json(
        createApiResponse(false, undefined, 'Validation failed', errors),
        400
      );
    }
  }),
  async (c) => {
    const { url, slug: customSlug } = c.req.valid('json') as CreateShortUrlInput;
    const slug = customSlug || generateRandomSlug();
    
    try {
      // Check if slug already exists
      const existingUrl = await c.env.SHORT_URLS.get(slug);
      if (existingUrl) {
        return c.json(
          createApiResponse(false, undefined, 'This short URL is already in use'),
          400
        );
      }
      
      // Save short URL
      await c.env.SHORT_URLS.put(slug, url);
      
      // Return full short URL
      const shortUrl = `${c.env.BASE_URL}/${slug}`;
      return c.json(
        createApiResponse(true, { url, shortUrl, slug }),
        201
      );
    } catch (error) {
      console.error('Error creating short URL:', error);
      return c.json(
        createApiResponse(false, undefined, 'Error creating short URL'),
        500
      );
    }
  }
);

// Redirect short URL
app.get('/:slug', async (c) => {
  const { slug } = c.req.param();
  
  try {
    // Validate slug format
    const validation = getUrlBySlugSchema.safeParse({ slug });
    if (!validation.success) {
      return c.notFound();
    }
    
    const url = await c.env.SHORT_URLS.get(slug);
    if (!url) {
      return c.notFound();
    }
    
    return c.redirect(url);
  } catch (error) {
    console.error('Error redirecting:', error);
    return c.notFound();
  }
});

// Get short URL details
app.get('/api/urls/:slug', async (c) => {
  const { slug } = c.req.param();
  
  try {
    // Validate slug format
    const validation = getUrlBySlugSchema.safeParse({ slug });
    if (!validation.success) {
      return c.json(
        createApiResponse(false, undefined, 'Invalid short URL code'),
        400
      );
    }
    
    const url = await c.env.SHORT_URLS.get(slug);
    if (!url) {
      return c.json(
        createApiResponse(false, undefined, 'Specified short URL not found'),
        404
      );
    }
    
    const shortUrl = `${c.env.BASE_URL}/${slug}`;
    return c.json(
      createApiResponse(true, { url, shortUrl, slug })
    );
  } catch (error) {
    console.error('Error fetching URL details:', error);
    return c.json(
      createApiResponse(false, undefined, 'Error getting short URL details'),
      500
    );
  }
});

export default app;
