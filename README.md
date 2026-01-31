# barryfrost

My personal website, hosted at [barryfrost.com](https://barryfrost.com/).

Built using the [Architect](https://arc.codes/) serverless framework in Node.js and deployed to AWS Lambda.

Uses [Vibrancy](https://github.com/barryf/vibrancy) as a headless CMS backend via the Micropub API.

## Prerequisites

- Node.js 22+
- npm
- AWS account (for deployment)
- [Vibrancy](https://github.com/barryf/vibrancy) instance for the CMS backend

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/barryf/barryfrost.git
   cd barryfrost
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the required environment variables (see below).

4. Start the local development server:
   ```bash
   npm start
   ```

   The site will be available at http://localhost:4444

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start local development server (port 4444) |
| `npm run build` | Build CSS and JS for production |
| `npm run build-tw` | Build Tailwind CSS for production |
| `npm run build-tw-dev` | Build Tailwind CSS for development |
| `npm run build-js` | Transpile JavaScript with Babel |
| `npm run lint` | Run StandardJS linter |
| `npm run lint:fix` | Run linter and auto-fix issues |

## Environment Variables

Create a `.env` file in the project root with the following variables:

### Required

| Variable | Description |
|----------|-------------|
| `ROOT_URL` | Base URL of the website (e.g., `https://barryfrost.com/`) |
| `MICROPUB_URL` | URL of the Micropub endpoint (Vibrancy backend) |
| `MICROPUB_TOKEN` | Bearer token for Micropub API authentication |

### Optional

| Variable | Description |
|----------|-------------|
| `WEBMENTION_URL` | Webmention endpoint URL |
| `MAPBOX_ACCESS_TOKEN` | Mapbox API token for location maps |
| `CLOUDFLARE_KEY` | Cloudflare API key (for cache purging) |
| `CLOUDFLARE_EMAIL` | Cloudflare account email |
| `CLOUDFLARE_ZONE` | Cloudflare zone ID |
| `CLOUDFLARE_TOKEN` | Cloudflare API token |

## Project Structure

```
barryfrost/
├── app.arc                 # Architect configuration
├── assets/
│   ├── scripts/            # Client-side JavaScript (source)
│   └── styles.css          # Tailwind CSS source
├── public/                 # Static assets (fingerprinted)
│   └── scripts/            # Transpiled JavaScript
├── src/
│   └── http/               # Lambda function handlers
│       ├── get-catchall/   # Main page handler
│       ├── get-feed_json/  # JSON Feed endpoint
│       ├── get-rss/        # RSS feed endpoint
│       └── ...
└── .github/
    └── workflows/          # GitHub Actions CI/CD
```

## Deployment

The site is automatically deployed to AWS when changes are pushed to the `master` branch.

For manual deployment:

```bash
npx arc deploy --production
```

Requires AWS credentials configured via environment variables or AWS CLI.

## Status

This project is under active development and should be considered experimental. You're free to fork and hack on it but its primary purpose is to evolve based on my needs.

## Licence

The source code is available under the MIT licence, but you may not copy my site's design or content. SVG icons are sourced from [Heroicons](https://heroicons.com).
