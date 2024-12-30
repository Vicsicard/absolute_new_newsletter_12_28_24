import OpenAI from 'openai';
import { APIError } from './errors';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateImage(prompt: string, retries = 2): Promise<string | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "natural"
      });

      return response.data[0]?.url || null;
    } catch (error: any) {
      console.error('Error generating image:', {
        attempt: i + 1,
        error: error.message,
        status: error.status
      });
      
      if (error?.status === 429 && i < retries - 1) {
        const waitTime = Math.min(500 * Math.pow(1.2, i), 1500); 
        console.log(`Rate limited in image generation. Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      if (i === retries - 1) {
        throw new APIError('Failed to generate image after retries', 500);
      }
    }
  }
  return null;
}
