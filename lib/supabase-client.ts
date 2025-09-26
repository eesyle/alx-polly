/**
 * Client-Safe Supabase Configuration
 * Contains only the basic Supabase client that can be safely used in Client Components
 */

import { createClient } from '@supabase/supabase-js';

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Supabase Client Instance
 * 
 * Basic Supabase client for client-side operations like:
 * - Authentication (sign in, sign up, sign out)
 * - Real-time subscriptions
 * - Basic database queries (with RLS protection)
 * 
 * This client is safe to use in Client Components and does not
 * require server-side APIs like next/headers.
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);