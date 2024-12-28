# AI-Powered Newsletter Generator

A modern, AI-driven newsletter generation system that creates personalized, industry-specific newsletters using GPT-4 and DALL-E 3.

## Features

### 🤖 AI-Powered Content
- **GPT-4 Integration**: Generates professional, industry-specific newsletter content
- **DALL-E 3 Images**: Creates relevant, high-quality images for each section
- **Structured Format**: Three distinct sections:
  - Pain Point Analysis
  - Common Mistakes
  - Company Solutions

### 📧 Email System
- **Professional Templates**: Modern, responsive email designs
- **Brevo Integration**: Reliable email delivery service
- **Custom Formatting**: Beautiful HTML templates with proper styling

### 🎯 Industry Focus
- **Tailored Content**: Content specific to your industry
- **Target Audience**: Customized for your audience
- **Professional Tone**: Clear, engaging, and authoritative

### 💼 Business Features
- **Company Management**: Easy company registration and setup
- **Contact Lists**: CSV upload for contact management
- **Analytics**: Track newsletter performance (coming soon)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key
- Brevo API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/newsletter-app.git
cd newsletter-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```env
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Brevo Email Configuration
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=your_sender_email
BREVO_SENDER_NAME=Your Newsletter Service
```

4. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the app.

## Usage

1. **Company Registration**
   - Fill out the company details form
   - Provide industry and target audience information

2. **Newsletter Generation**
   - System generates a draft newsletter
   - Content is tailored to your industry
   - AI generates relevant images

3. **Review and Distribution**
   - Review the draft newsletter
   - Upload your contact list
   - Send to your audience

## Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase
- **AI**: OpenAI (GPT-4 & DALL-E 3)
- **Email**: Brevo (formerly Sendinblue)

## Project Structure

```
newsletter-app/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   └── components/        # React components
├── utils/                 # Utility functions
├── types/                 # TypeScript types
└── docs/                  # Documentation
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI for GPT-4 and DALL-E 3
- Brevo for email services
- Supabase for database services
- Next.js team for the amazing framework
