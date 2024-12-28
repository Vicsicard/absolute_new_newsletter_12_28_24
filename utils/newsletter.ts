import SibApiV3Sdk from '@sendinblue/client'

if (!process.env.SENDINBLUE_API_KEY) {
  throw new Error('Missing SENDINBLUE_API_KEY environment variable')
}

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()
apiInstance.setApiKey(SibApiV3Sdk.AccountApiApiKeys.apiKey, process.env.SENDINBLUE_API_KEY)

export async function sendNewsletter(
  to: { email: string }[],
  subject: string,
  htmlContent: string,
  from = { email: 'newsletter@example.com', name: 'Newsletter Service' }
) {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()
  sendSmtpEmail.subject = subject
  sendSmtpEmail.htmlContent = htmlContent
  sendSmtpEmail.sender = from
  sendSmtpEmail.to = to
  
  try {
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail)
    return response
  } catch (error) {
    console.error('Error sending newsletter:', error)
    throw error
  }
}

export async function validateEmailList(emails: string[]) {
  // Add any email validation logic here
  return emails.filter(email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  })
}

export function formatNewsletterHtml(content: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
        ${content}
        <hr style="margin: 20px 0;">
        <footer style="font-size: 12px; color: #666;">
          <p>To unsubscribe, click <a href="[unsubscribe_link]">here</a></p>
        </footer>
      </body>
    </html>
  `
}
