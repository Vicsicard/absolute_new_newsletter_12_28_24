# AI-Powered Newsletter Generator

A modern, AI-powered newsletter generation system that creates personalized technology newsletters using OpenAI's GPT-4 and DALL-E for content and image generation. Features a robust queue-based generation system for reliable content creation.

## Features

- 🤖 AI-powered content generation using GPT-4
- 🎨 Automatic image generation with DALL-E
- 📧 Email delivery via Brevo API
- 📊 Progress tracking and status monitoring
- 🔄 Queue-based generation system with retry mechanism
- 🎯 Three customizable content sections:
  - Welcome Message
  - Industry Trends
  - Practical Tips
- 💾 Persistent storage with Supabase
- 📈 Status tracking and error handling
- 🔍 Generation progress monitoring

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key
- Brevo API key

### Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=your_sender_email
BREVO_SENDER_NAME=your_sender_name
BASE_URL=your_base_url
```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/newsletter-app.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Endpoints

### Newsletter Generation
- `POST /api/newsletter/generate`: Queue a new newsletter generation
- `GET /api/newsletter/status/[id]`: Check generation queue status
- `POST /api/newsletter/send-draft/[id]`: Send a draft newsletter
- `POST /api/newsletter/send`: Send newsletter to contacts

### Company Management
- `POST /api/onboarding`: Register new company
- `GET /api/company/[id]/latest-newsletter`: Get company's latest newsletter

### Contact Management
- `POST /api/contacts/upload`: Upload contact list

## Queue System

The application uses a robust queue system for newsletter generation:

1. **Queue Creation**
   - Each newsletter section is queued separately
   - Status tracking per section
   - Retry mechanism for failed generations

2. **Status Tracking**
   - `pending`: Initial state
   - `in_progress`: Currently generating
   - `completed`: Successfully generated
   - `failed`: Generation failed

3. **Error Handling**
   - Automatic retries for failed generations
   - Error message tracking
   - Attempt counting

## Architecture

The application uses:
- Next.js 14 for the framework
- Supabase for database and authentication
- OpenAI GPT-4 for content generation
- DALL-E 3 for image generation
- Brevo for email delivery
- Queue-based system for reliable generation

### Database Schema

Key tables:
- `newsletters`: Stores newsletter metadata
- `newsletter_sections`: Individual content sections
- `newsletter_generation_queue`: Generation queue status
- `companies`: Company information
- `contacts`: Contact list
- `newsletter_contacts`: Newsletter-contact relationships

## Current Development Status

### Known Issues
- Queue generation process requires further debugging
- Intermittent failures in section and image generation
- Need to improve error handling and retry mechanisms

### Upcoming Improvements
- Enhanced logging for queue generation
- More robust error tracking
- Implement more granular status monitoring

### Debugging Notes
- Verify queue initialization process
- Check OpenAI and DALL-E API interaction
- Review database transaction management

## Project Status Update

### Recent Improvements
1. **OpenAI Handling**: Improved handling of OpenAI API calls with increased retries and exponential backoff. Added a 3-minute timeout for each call.
2. **Delays**: Increased delays between sections to 15 minutes and added a 30-minute delay after errors to manage OpenAI capacity issues effectively.
3. **Queue Initialization**: Enhanced queue initialization verification with extended retries and logging.
4. **Error Handling**: Improved error logging and handling throughout the newsletter generation process.
5. **New Feature**: Added support for customizable newsletter templates.
6. **Bug Fix**: Resolved issue with duplicate newsletter generations.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

For detailed contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Documentation

Additional documentation:
- [Database Indexes](docs/DATABASE_INDEXES.md)
- [Brevo Integration](docs/BREVO_INTEGRATION.md)
- [Project Status](PROJECT_STATUS.md)
