# 🔗 Chisai - A Minimalist URL Shortener

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/calpa/chisai/actions/workflows/node.js.yml/badge.svg)](https://github.com/calpa/chisai/actions)
[![codecov](https://codecov.io/gh/calpa/chisai/graph/badge.svg?token=YOUR-TOKEN-HERE)](https://codecov.io/gh/calpa/chisai)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-FF1E1E?style=flat&logo=hono&logoColor=white)

Chisai (小さい, meaning "small" in Japanese) is a lightweight, fast, and secure URL shortener service built with Hono and Cloudflare Workers. It's designed to be simple, efficient, and easy to deploy.

## ✨ Features

- 🚀 Blazing fast URL shortening with Cloudflare's global network
- 🔒 Secure token-based authentication for API endpoints
- ✅ URL validation and sanitization
- 🛠️ Simple and clean RESTful API
- 📦 Built with TypeScript for type safety
- 🧪 Comprehensive test coverage with Vitest
- ⚡ Deploy instantly to Cloudflare Workers

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or later
- npm or yarn
- Cloudflare Wrangler CLI
- Cloudflare account with Workers enabled

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/calpa/chisai.git
   cd chisai
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Copy the example environment file and update with your configuration:
   ```bash
   cp wrangler.toml.example wrangler.toml
   ```
   Then edit the `wrangler.toml` file with your Cloudflare account ID and other settings.

### Development

Start the development server:

```bash
npm run dev
# or
yarn dev
```

### Testing

Run the test suite:

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate test coverage report
npm run test:coverage
```

### Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

## 📚 API Reference

### Create a Short URL

```http
POST /api/urls
Content-Type: application/json
Authorization: Bearer YOUR_API_TOKEN

{
  "url": "https://example.com/very/long/url/that/you/want/to/shorten",
  "slug": "optional-custom-slug"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "url": "https://example.com/very/long/url/that/you/want/to/shorten",
    "slug": "abc123",
    "shortUrl": "https://your-domain.com/abc123"
  }
}
```

### Redirect to Original URL

```http
GET /:slug
```

## 🔧 Configuration

### Environment Variables

Create a `.dev.vars` file in the root directory with the following variables:

```
# Required in production
API_TOKEN=your-secure-token-here

# Optional
ENVIRONMENT=development
BASE_URL=https://your-domain.com
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Hono](https://hono.dev/)
- Deployed on [Cloudflare Workers](https://workers.cloudflare.com/)
- Tested with [Vitest](https://vitest.dev/)
- Maintained by [Calpa](https://github.com/calpa)
