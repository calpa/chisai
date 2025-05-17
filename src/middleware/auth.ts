import { Context } from 'hono';

type CloudflareBindings = {
  API_TOKEN?: string;
};

export const requireAuth = async (c: Context, next: () => Promise<void>) => {
  // Skip auth check if we're in a test environment
  if (c.env.ENVIRONMENT === 'test') {
    return;
  }

  // Skip auth check if no API_TOKEN is set (for development)
  if (!c.env.API_TOKEN) {
    console.warn('API_TOKEN is not set. Authentication is disabled.');
    return;
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header. Use Bearer token.'
      },
      401
    );
  }

  const token = authHeader.split(' ')[1];
  if (token !== c.env.API_TOKEN) {
    return c.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Invalid API token'
      },
      401
    );
  }
  return;
};
