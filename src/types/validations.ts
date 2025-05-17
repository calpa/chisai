import { z } from 'zod';

// Common validation messages
const VALIDATION_MESSAGES = {
  URL_REQUIRED: 'URL is required',
  INVALID_URL: 'Please enter a valid URL',
  SLUG_REQUIRED: 'Short URL code is required',
  SLUG_INVALID: 'Short URL code can only contain English letters, numbers, hyphens(-) and underscores(_)',
  SLUG_TOO_SHORT: 'Short URL code must be at least 3 characters',
  SLUG_TOO_LONG: 'Short URL code cannot exceed 50 characters',
  SLUG_RESERVED: 'This short URL code is reserved',
} as const;

// Reserved slugs that cannot be used
const RESERVED_SLUGS = [
  'api',
  'admin',
  'dashboard',
  'login',
  'register',
  'static',
  'assets',
  'images',
  'css',
  'js',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
];

// Base URL validation
const urlSchema = z.string({
  required_error: VALIDATION_MESSAGES.URL_REQUIRED,
  invalid_type_error: VALIDATION_MESSAGES.INVALID_URL,
}).url({
  message: VALIDATION_MESSAGES.INVALID_URL,
}).max(2000, 'URL cannot exceed 2000 characters');

// Slug validation
const slugSchema = z.string({
  required_error: VALIDATION_MESSAGES.SLUG_REQUIRED,
  invalid_type_error: VALIDATION_MESSAGES.SLUG_INVALID,
})
  .min(3, VALIDATION_MESSAGES.SLUG_TOO_SHORT)
  .max(50, VALIDATION_MESSAGES.SLUG_TOO_LONG)
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    VALIDATION_MESSAGES.SLUG_INVALID
  )
  .refine(
    (slug) => !RESERVED_SLUGS.includes(slug),
    VALIDATION_MESSAGES.SLUG_RESERVED
  )
  .transform((val) => val.toLowerCase());

// Schema for creating a short URL
export const createShortUrlSchema = z.object({
  url: urlSchema,
  slug: z.optional(slugSchema),
}).strict();

// Schema for getting URL by slug
export const getUrlBySlugSchema = z.object({
  slug: slugSchema,
});

// Schema for API responses
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  errors: z.record(z.string()).optional(),
});

// Type exports
export type CreateShortUrlInput = z.infer<typeof createShortUrlSchema>;
export type GetUrlBySlugInput = z.infer<typeof getUrlBySlugSchema>;
export type ApiResponse = z.infer<typeof apiResponseSchema>;
