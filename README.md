# Newsletter Application

## Overview
This is a newsletter application built with Next.js for the frontend and Supabase for the backend. It allows users to create, manage, and send newsletters to their contacts.

## Features
- **Onboarding**: Users can create a company and add contacts.
- **Newsletter Management**: Create and manage newsletters, including sections and content.
- **Email Sending**: Send newsletters to contacts with tracking for sent and failed emails.

## Getting Started
1. Clone the repository:
   ```bash
   git clone https://github.com/Vicsicard/absolute_new_newsletter_12_28_24.git
   cd newsletter-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in a `.env.local` file based on the provided `.env.example`.
4. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment
This application is deployed on Vercel. For detailed deployment instructions, refer to the `DEPLOYMENT_PROCESS.md` file.

## Current Status
- The application is currently in a stable state, ready for deployment.
- Recent updates include:
  - Enhanced email sending functionality.
  - Improved error handling and logging.
  - Aligned all types with the Supabase schema.

## Upcoming Features
- Analytics tracking implementation.
- UI/UX enhancements based on user feedback.
- Support for images in newsletters.

## Dependencies
- OpenAI API (GPT-4 & DALL-E 3)
- Brevo Email Service
- Supabase Database
- Next.js 14
- TypeScript
- Tailwind CSS

## Environment Variables
Required for production:
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`

## Known Issues
- None currently reported
