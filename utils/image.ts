import OpenAI from 'openai';
import { APIError } from './errors';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateImage(prompt: string): Promise<string | null> {
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
  } catch (error) {
    console.error('Error generating image:', error);
    throw new APIError('Failed to generate image', 500);
  }
}
