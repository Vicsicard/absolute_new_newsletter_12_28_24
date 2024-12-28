import SibApiV3Sdk from '@sendinblue/client'

if (!process.env.SENDINBLUE_API_KEY) {
  throw new Error('Missing SENDINBLUE_API_KEY environment variable')
}

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()
apiInstance.setApiKey(SibApiV3Sdk.AccountApiApiKeys.apiKey, process.env.SENDINBLUE_API_KEY)

interface SendEmailParams {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  from?: { email: string; name: string };
}

export async function sendEmail({
  to,
  subject,
  htmlContent,
  from = { email: 'newsletter@example.com', name: 'Newsletter Service' }
}: SendEmailParams) {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()
  
  sendSmtpEmail.subject = subject
  sendSmtpEmail.htmlContent = htmlContent
  sendSmtpEmail.sender = from
  sendSmtpEmail.to = to

  try {
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail)
    return response
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

export async function sendBulkEmails(
  recipients: { email: string; name?: string }[],
  subject: string,
  htmlContent: string,
  from?: { email: string; name: string }
) {
  // Split recipients into chunks of 50 to avoid rate limits
  const chunkSize = 50
  const chunks = recipients.reduce((acc, curr, i) => {
    const chunkIndex = Math.floor(i / chunkSize)
    if (!acc[chunkIndex]) {
      acc[chunkIndex] = []
    }
    acc[chunkIndex].push(curr)
    return acc
  }, [] as typeof recipients[])

  const results = []
  for (const chunk of chunks) {
    try {
      const result = await sendEmail({
        to: chunk,
        subject,
        htmlContent,
        from
      })
      results.push(result)
      // Add a small delay between chunks to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Error sending bulk emails:', error)
      throw error
    }
  }

  return results
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateEmailList(emails: string[]): string[] {
  return emails.filter(email => validateEmail(email))
}
