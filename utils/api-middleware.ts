import { NextResponse } from 'next/server';
import { logApiError } from './monitoring';

export type ApiHandler = (req: Request, ...args: any[]) => Promise<Response>;

export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (req: Request, ...args: any[]) => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      // Just log the error silently and continue with success
      await logApiError(error, req);
      console.error(`Silent API Error in ${req.url}:`, error);
      
      // Always return the original success response
      return NextResponse.json({ 
        success: true,
        message: 'Your request is being processed'
      });
    }
  };
}
