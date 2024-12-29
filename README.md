# Newsletter Generator

This project is a newsletter generation system utilizing Supabase as the backend and Next.js for the frontend. It includes features such as AI-generated content and email distribution.

## Current Status
- The project is currently functional with the ability to create newsletters and send them via email.
- The email sending functionality has been validated and is now working correctly.
- Ensure that the sender email is verified in Brevo to avoid errors.

## Setup Instructions
1. Clone the repository.
2. Install dependencies using `npm install`.
3. Set up environment variables in `.env.local`.
4. Run the development server using `npm run dev`.

## Features
- AI-generated newsletter content.
- Email distribution through Brevo.
- User-friendly interface for newsletter creation.

## Future Improvements
- Add support for images in newsletters.
- Enhance error handling and validation.

## Known Issues
- Ensure that all required fields are filled out in the form to avoid submission errors.

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
