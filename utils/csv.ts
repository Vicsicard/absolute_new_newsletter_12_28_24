import { parse } from 'csv-parse'
import { Readable } from 'stream'

interface SubscriberData {
  email: string;
  [key: string]: string;
}

export async function parseCSV(fileContent: Buffer): Promise<SubscriberData[]> {
  const parser = parse({
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })

  const records: SubscriberData[] = []
  const stream = Readable.from(fileContent)

  return new Promise((resolve, reject) => {
    stream
      .pipe(parser)
      .on('data', (record: SubscriberData) => {
        // Validate email format
        if (record.email && isValidEmail(record.email)) {
          records.push(record)
        }
      })
      .on('end', () => resolve(records))
      .on('error', reject)
  })
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateCSVHeaders(headers: string[]): boolean {
  const requiredHeaders = ['email']
  return requiredHeaders.every(header => 
    headers.map(h => h.toLowerCase()).includes(header.toLowerCase())
  )
}

export async function processSubscriberCSV(
  file: Buffer,
  companyId: string
): Promise<{ email: string; company_id: string }[]> {
  const subscribers = await parseCSV(file)
  
  return subscribers.map(subscriber => ({
    email: subscriber.email.toLowerCase(),
    company_id: companyId
  }))
}
