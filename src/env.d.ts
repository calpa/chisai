/// <reference types="./worker-configuration.d.ts" />

declare module "cloudflare:test" {
  // ProvidedEnv controls the type of `import("cloudflare:test").env`
  interface ProvidedEnv extends Env {}
}

// Extend the global Cloudflare bindings
declare global {
  // This extends the global Cloudflare bindings
  namespace NodeJS {
    interface ProcessEnv {
      // Add any environment variables that should be available in process.env
      NODE_ENV?: 'development' | 'production' | 'test';
    }
  }
}
