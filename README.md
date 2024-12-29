# Newsletter App

## Overview
This project is a newsletter generation system that utilizes Supabase as the backend and Next.js for the frontend. The application allows users to create, manage, and send newsletters efficiently.

## Features
- **Onboarding**: Add new companies and contacts through a user-friendly interface.
- **Email Sending**: Integrate with Brevo for sending newsletters, with improved error handling and response formatting.
- **Newsletter Generation**: Generate engaging newsletter content using OpenAI's GPT-4.
- **Dynamic Sections**: Create sections dynamically based on user input and predefined templates.

## Recent Changes
- Updated the email types to match the database schema:
  - Removed 'sending' from `NewsletterStatus`
  - Removed 'inactive' from `ContactStatus`
  - Ensured all status types match the database schema
- Updated the newsletter utility to ensure:
  - The query retrieves company data correctly using an inner join.
  - The `NewsletterWithCompany` interface accurately reflects the joined data structure.
  - The generated sections now include a `status` field and a `section_number`.

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Vicsicard/absolute_new_newsletter_12_28_24.git
   cd absolute_new_newsletter_12_28_24
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in a `.env.local` file:
   ```bash
   OPENAI_API_KEY=your_openai_api_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   BREVO_API_KEY=your_brevo_api_key
   ```

## Usage
1. Run the development server:
   ```bash
   npm run dev
   ```
2. Access the application at `http://localhost:3000`.

## Next Steps
- Monitor application performance and user feedback after deployment.
- Continue refining features based on testing and user requirements.
- Ensure all components align with the Supabase database schema as outlined in `DATABASE_INDEXES.md`.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request.

## License
This project is licensed under the MIT License.
