import { parse } from 'csv-parse'
import { Readable } from 'stream'
import { Database } from '@/types/database'

type ContactInsert = Database['public']['Tables']['contacts']['Insert']

interface ContactData {
  email: string;
  name?: string;
  [key: string]: string | undefined;
}

export async function parseCSV(fileContent: Buffer | string): Promise<ContactData[]> {
  const parser = parse({
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })

  const records: ContactData[] = []
  // Ensure we're working with a Buffer
  const buffer = Buffer.isBuffer(fileContent) ? fileContent : Buffer.from(fileContent)
  const stream = Readable.from(buffer)

  return new Promise((resolve, reject) => {
    stream
      .pipe(parser)
      .on('data', (record: ContactData) => {
        // Validate email format
        if (record.email && isValidEmail(record.email)) {
          records.push({
            email: record.email.toLowerCase(),
            name: record.name,
          })
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

export async function processContactCSV(
  file: Buffer,
  companyId: string
): Promise<ContactInsert[]> {
  const contacts = await parseCSV(file)
  
  return contacts.map(contact => ({
    email: contact.email.toLowerCase(),
    name: contact.name,
    company_id: companyId,
    status: 'active',
  }))
}
