# AI-Powered Newsletter Generator

## Version 1.0.1

An intelligent newsletter generation system that creates personalized, engaging content for businesses using AI.

## Features

### Content Generation
- **Smart Section Structure**
  - Welcome: Pain point analysis and industry insights
  - Industry Trends: Common mistakes and solutions
  - Practical Tips: Company-specific solutions and value propositions

### Email Integration
- Brevo SDK integration for reliable email delivery
- Draft preview functionality
- Bulk sending capabilities

### Status Tracking
- Real-time generation progress monitoring
- Queue management system
- Latest newsletter status endpoint

## Getting Started

1. **Environment Setup**
   ```bash
   npm install
   cp .env.example .env
   ```

2. **Configuration**
   - Set up required API keys in `.env`:
     - `OPENAI_API_KEY`
     - `BREVO_API_KEY`
     - `SUPABASE_URL`
     - `SUPABASE_KEY`

3. **Development**
   ```bash
   npm run dev
   ```

4. **Production Build**
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### Newsletter Generation
- `POST /api/newsletter/generate`: Generate new newsletter
- `GET /api/newsletter/status/[id]`: Check specific newsletter status
- `GET /api/newsletter/latest`: Get latest newsletter status
- `POST /api/newsletter/send-draft`: Send draft for review
- `POST /api/newsletter/send`: Send final newsletter

## Project Structure

```
newsletter-app/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   └── components/     # React components
├── utils/              # Utility functions
├── docs/              # Documentation
└── supabase/          # Database migrations
```

## Documentation
- [Project Status](docs/PROJECT_STATUS.md)
- [Database Indexes](docs/DATABASE_INDEXES.md)
- [Deployment Process](docs/DEPLOYMENT_PROCESS.md)
- [Brevo SDK Migration](docs/BREVO_SDK_MIGRATION.md)
- [Branching Strategy](docs/BRANCHING.md)

## Development

### Branching Strategy
- `master`: Production code
- `development`: Development code
- `feature/*`: Feature branches

### Testing
Run tests with:
```bash
npm test
```

## Monitoring
- Vercel deployment logs
- Supabase database monitoring
- Email delivery tracking

## Contributing
1. Create feature branch from `development`
2. Make changes
3. Submit pull request
4. Await review and merge

## License
MIT

## Support
For support, please check the documentation or open an issue.
