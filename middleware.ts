import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Skip authentication for test endpoints
  if (request.nextUrl.pathname.startsWith('/api/test/')) {
    const response = NextResponse.next()
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    )
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    )

    return response
  }

  // Add CORS headers
  const response = NextResponse.next()

  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  )
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  )

  return response
}

export const config = {
  matcher: '/api/:path*',
}
