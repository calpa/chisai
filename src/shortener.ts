import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from './middleware/auth';
import { 
  createShortUrlSchema, 
  getUrlBySlugSchema,
  type CreateShortUrlInput,
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

// Enable CORS for all routes
app.use(
  '/*',
  cors({
    origin: '*', // Allow all origins in development
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: false,
  })
);

// Home page
app.get('/', (c) => {
  console.log('[INFO] GET / - healthcheck');
  return c.text('Short URL Service API is running!');
});

// Create short URL (requires authentication)
app.post(
  '/api/urls',
  async (c, next) => {
    console.log('[INFO] POST /api/urls - checking authentication');
    const authResponse = await requireAuth(c, next);
    if (authResponse) {
      console.log('[WARN] POST /api/urls - authentication failed or not provided');
      return authResponse;
    }
    return next();
  },
  zValidator('json', createShortUrlSchema, (result, c) => {
    if (!result.success) {
      const errors = result.error.issues.reduce((acc, issue) => ({
        ...acc,
        [issue.path[0]]: issue.message,
      }), {});
      console.warn('[WARN] POST /api/urls - validation failed', errors);
      return c.json(
        createApiResponse(false, undefined, 'Validation failed', errors),
        400
      );
    }
  }),
  async (c) => {
    const { url, slug: customSlug } = c.req.valid('json') as CreateShortUrlInput;
    const slug = customSlug || generateRandomSlug();

    console.log(`[INFO] POST /api/urls - received URL: ${url}, requested slug: ${customSlug || '[auto-generated]'}`);

    try {
      // Check if slug already exists
      const existingUrl = await c.env.SHORT_URLS.get(slug);
      if (existingUrl) {
        console.warn(`[WARN] POST /api/urls - slug already in use: ${slug}`);
        return c.json(
          createApiResponse(false, undefined, 'This short URL is already in use'),
          400
        );
      }

      // Save short URL
      await c.env.SHORT_URLS.put(slug, url);

      // Return full short URL
      const shortUrl = `${c.env.BASE_URL}/${slug}`;
      console.log(`[INFO] POST /api/urls - short URL created: ${shortUrl}`);
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
  console.log(`[INFO] GET /${slug} - redirect attempt`);

  try {
    // Validate slug format
    const validation = getUrlBySlugSchema.safeParse({ slug });
    if (!validation.success) {
      console.warn(`[WARN] GET /${slug} - invalid slug format`);
      return c.notFound();
    }

    const url = await c.env.SHORT_URLS.get(slug);
    if (!url) {
      console.warn(`[WARN] GET /${slug} - slug not found`);
      return c.notFound();
    }

    console.log(`[INFO] GET /${slug} - redirecting to ${url}`);
    return c.redirect(url);
  } catch (error) {
    console.error('Error redirecting:', error);
    return c.notFound();
  }
});

// Get short URL details
app.get('/api/urls/:slug', async (c) => {
  const { slug } = c.req.param();
  console.log(`[INFO] GET /api/urls/${slug} - fetch short URL details`);

  try {
    // Validate slug format
    const validation = getUrlBySlugSchema.safeParse({ slug });
    if (!validation.success) {
      console.warn(`[WARN] GET /api/urls/${slug} - invalid slug`);
      return c.json(
        createApiResponse(false, undefined, 'Invalid short URL code'),
        400
      );
    }

    const url = await c.env.SHORT_URLS.get(slug);
    if (!url) {
      console.warn(`[WARN] GET /api/urls/${slug} - not found`);
      return c.json(
        createApiResponse(false, undefined, 'Specified short URL not found'),
        404
      );
    }

    const shortUrl = `${c.env.BASE_URL}/${slug}`;
    console.log(`[INFO] GET /api/urls/${slug} - found: ${shortUrl}`);
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
