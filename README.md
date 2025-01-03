# Newsletter Generator App

A powerful newsletter generation application that uses AI to create engaging content for your company newsletters.

## Features

- 🤖 AI-powered content generation
- 📧 Automated email sending
- 📊 Company and contact management
- 🔄 Queue-based processing
- 📝 Draft preview and testing
- 🎯 Industry-specific content
- 🖼️ AI-generated images
- 📈 Status tracking

## Tech Stack

- **Frontend**: Next.js with TypeScript
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4 & DALL-E 3
- **Email**: Brevo (formerly Sendinblue)
- **Queue**: Custom implementation with Supabase

## Getting Started

### Prerequisites

1. Node.js 18 or higher
2. npm or yarn
3. Supabase account
4. OpenAI API key
5. Brevo API key

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd newsletter-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with the following:
```env
OPENAI_API_KEY=your_openai_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key
BREVO_API_KEY=your_brevo_key
BREVO_SENDER_EMAIL=your_sender_email
BREVO_SENDER_NAME=your_sender_name
BASE_URL=your_app_url
NODE_ENV=development
```

4. Start the development server:
```bash
npm run dev
```

5. Start the queue processor:
```bash
npm run process
```

## Project Structure

```
newsletter-app/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   └── ...                # Page components
├── components/            # React components
├── docs/                  # Documentation
│   └── DATABASE_INDEXES.md # Database schema specification
├── supabase/             # Database migrations and config
│   └── migrations/       # SQL migration files
├── scripts/              # Queue processor and utilities
├── utils/                # Helper functions
└── types/                # TypeScript types
```

## Database Schema

The application uses Supabase with the following main tables:
- `companies` - Company information and settings
- `contacts` - Contact list management for each company
- `newsletters` - Newsletter metadata and status tracking
- `newsletter_sections` - Content sections for each newsletter
- `newsletter_generation_queue` - Queue for processing newsletter sections
- `image_generation_history` - Tracking for AI image generation
- `industry_insights` - Industry-specific content storage
- `csv_uploads` - Contact list import tracking
- `compiled_newsletters` - Final newsletter storage

For detailed schema information, including all indexes and constraints, see [DATABASE_INDEXES.md](./docs/DATABASE_INDEXES.md).

## Queue Processing

The application uses a queue-based system for reliable newsletter generation:
1. Newsletter creation triggers queue items for each section
2. Queue processor picks up pending items
3. GPT-4 generates content for each section
4. DALL-E 3 creates relevant images
5. Content is compiled into newsletter sections
6. Email is formatted and sent using Brevo
7. Status is tracked throughout the process

## Newsletter Sections

Each newsletter contains three main sections:
1. **Welcome Message**: Personalized company introduction
2. **Industry Trends**: AI-generated industry insights
3. **Practical Tips**: Actionable advice for the audience

## Error Handling

The system includes robust error handling:
- Automatic retries for failed operations
- Status tracking for each step
- Detailed error logging
- Queue item attempt counting
- Proper cleanup of failed items

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email [support-email] or create an issue in the repository.
