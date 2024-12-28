interface EmailTemplateProps {
  content: string;
  companyName?: string;
  unsubscribeUrl?: string;
}

export function generateEmailTemplate({
  content,
  companyName = '',
  unsubscribeUrl = '#'
}: EmailTemplateProps): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${companyName} Newsletter</title>
      </head>
      <body style="
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
      ">
        <div style="
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        ">
          ${companyName && `
            <header style="
              text-align: center;
              margin-bottom: 30px;
            ">
              <h1 style="
                color: #2563eb;
                margin: 0;
                font-size: 24px;
              ">${companyName}</h1>
            </header>
          `}
          
          <main style="
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          ">
            ${content}
          </main>
          
          <footer style="
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            font-size: 14px;
            color: #666;
          ">
            <p style="margin: 0;">
              You received this email because you're subscribed to ${companyName} newsletters.
            </p>
            <p style="margin: 10px 0;">
              <a 
                href="${unsubscribeUrl}"
                style="
                  color: #2563eb;
                  text-decoration: none;
                "
              >
                Unsubscribe
              </a>
            </p>
          </footer>
        </div>
      </body>
    </html>
  `
}

export function generateUnsubscribeUrl(subscriberId: string, companyId: string): string {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
  return `${baseUrl}/unsubscribe?sid=${subscriberId}&cid=${companyId}`
}
