import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { RateLimiter } from '@/lib/security'

/**
 * Next.js Middleware for Authentication and Security
 * 
 * This middleware runs on every request and provides:
 * - Authentication verification for protected routes
 * - Rate limiting for sensitive endpoints
 * - Security headers for XSS and CSRF protection
 * - Session management and validation
 * - Automatic redirects for auth flows
 * 
 * The middleware executes before page rendering and API routes,
 * ensuring security policies are enforced at the edge.
 * 
 * @param request - The incoming Next.js request object
 * @returns NextResponse with appropriate redirects, headers, or continuation
 */
export async function middleware(request: NextRequest) {
  // Initialize response object with original request headers
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  /**
   * Rate Limiting Implementation
   * 
   * Extracts client IP address from various headers (proxy-aware)
   * and applies rate limiting to prevent abuse of sensitive endpoints.
   */
  const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
  
  // Define routes that require rate limiting protection
  const sensitiveRoutes = ['/auth/login', '/auth/register', '/polls/create']
  const isSensitiveRoute = sensitiveRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Apply rate limiting: 10 requests per minute for sensitive routes
  if (isSensitiveRoute && RateLimiter.isRateLimited(clientIP, 10, 60000)) {
    return new NextResponse('Too Many Requests', { status: 429 })
  }

  /**
   * Security Headers Configuration
   * 
   * Implements comprehensive security headers to protect against:
   * - Clickjacking attacks (X-Frame-Options)
   * - MIME type sniffing (X-Content-Type-Options)
   * - Information leakage (Referrer-Policy)
   * - XSS attacks (X-XSS-Protection, CSP)
   */
  response.headers.set('X-Frame-Options', 'DENY')                                    // Prevent iframe embedding
  response.headers.set('X-Content-Type-Options', 'nosniff')                         // Prevent MIME sniffing
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')        // Control referrer information
  response.headers.set('X-XSS-Protection', '1; mode=block')                         // Enable XSS filtering
  
  // Content Security Policy - defines allowed sources for various content types
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +                                                        // Default to same origin
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +                          // Allow inline scripts (needed for Next.js)
    "style-src 'self' 'unsafe-inline'; " +                                         // Allow inline styles (needed for Tailwind)
    "img-src 'self' data: https:; " +                                              // Allow images from self, data URLs, and HTTPS
    "connect-src 'self' https://*.supabase.co"                                     // Allow connections to Supabase
  )

  /**
   * Supabase Server Client Configuration
   * 
   * Creates a server-side Supabase client for middleware authentication.
   * Handles cookie management for session persistence across requests.
   * This client can access user sessions and validate authentication state.
   */
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /**
         * Cookie Getter
         * Retrieves cookie values from the incoming request
         */
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        
        /**
         * Cookie Setter
         * Sets cookies in both the request and response objects
         * This ensures session cookies are properly maintained
         */
        set(name: string, value: string, options: any) {
          // Set cookie in the request for immediate use
          request.cookies.set({
            name,
            value,
            ...options,
          })
          
          // Update response object to include new cookie
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          
          // Set cookie in the response for client
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        
        /**
         * Cookie Remover
         * Removes cookies by setting them to empty values
         * Used during sign-out operations
         */
        remove(name: string, options: any) {
          // Remove from request
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          
          // Update response object
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          
          // Remove from response (sets empty value)
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  try {
    /**
     * Session Validation and Authentication Check
     * 
     * Retrieves the current user session from Supabase to determine
     * authentication status for route protection decisions.
     */
    const { data: { session }, error } = await supabase.auth.getSession()

    /**
     * Protected Routes Configuration
     * 
     * Defines routes that require user authentication.
     * These routes will redirect unauthenticated users to login.
     */
    const protectedRoutes = [
      '/polls/create',      // Poll creation requires authentication
      '/profile',           // User profile management
      '/auth/profile',      // Profile settings
      '/polls/[id]/edit'    // Poll editing (dynamic route)
    ]
    
    // Check if current request is for a protected route
    const isProtectedRoute = protectedRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route.replace('[id]', ''))
    )

    /**
     * Authentication Enforcement for Protected Routes
     * 
     * Implements two-layer authentication check:
     * 1. Session existence check
     * 2. User validity verification
     * 
     * Redirects to login with return URL for seamless UX after authentication.
     */
    if (isProtectedRoute) {
      // First check: Does the user have a valid session?
      if (!session || error) {
        const redirectUrl = new URL('/auth/login', request.url)
        redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)  // Save intended destination
        return NextResponse.redirect(redirectUrl)
      }

      // Second check: Is the session user still valid in Supabase?
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (!user || userError) {
        const redirectUrl = new URL('/auth/login', request.url)
        redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)  // Save intended destination
        return NextResponse.redirect(redirectUrl)
      }
    }

    /**
     * Authentication Page Access Control
     * 
     * Prevents authenticated users from accessing login/register pages.
     * Redirects them to the main application instead.
     */
    const authRoutes = ['/auth/login', '/auth/register']
    const isAuthRoute = authRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    )

    // Redirect authenticated users away from auth pages
    if (isAuthRoute && session) {
      return NextResponse.redirect(new URL('/polls', request.url))
    }

  } catch (error) {
    /**
     * Error Handling for Authentication Failures
     * 
     * Logs authentication errors and provides fallback behavior.
     * For protected routes, defaults to requiring authentication.
     */
    console.error('Middleware error:', error)
    
    // Define protected routes for error fallback
    const protectedRoutes = ['/polls/create', '/profile', '/auth/profile']
    const isProtectedRoute = protectedRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    )
    
    // On authentication error, redirect protected routes to login
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return response
}

/**
 * Middleware Configuration
 * 
 * Defines which routes this middleware should run on.
 * Uses Next.js matcher patterns to specify paths.
 * 
 * Current configuration:
 * - /polls/create/* - Poll creation pages and sub-routes
 * - /profile/* - User profile pages and sub-routes
 * 
 * Note: The middleware also handles other routes programmatically
 * based on the protectedRoutes and authRoutes arrays defined above.
 */
export const config = {
  matcher: [
    '/polls/create/:path*',    // Poll creation routes
    '/profile/:path*',         // Profile management routes
  ],
};