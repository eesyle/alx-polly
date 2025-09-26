/**
 * Server-Side Security Utilities Module
 * Contains security functions that require server-side APIs like next/headers
 * This file should ONLY be imported in Server Components, API routes, and middleware
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SecurityValidator } from './security';

/**
 * Server-side authentication utilities
 * These functions require server-side APIs and cannot be used in Client Components
 */
export class AuthSecurity {
  /**
   * Creates a secure server client for Supabase
   * @returns Supabase server client
   * @throws Error if used in client-side context
   */
  static createSecureServerClient() {
    const cookieStore = cookies();
    
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.then((store) => store.get(name));
            return cookie?.then((c) => c?.value);
          },
        },
      }
    );
  }

  /**
   * Validates user authentication on server side
   * @returns User object if authenticated, null otherwise
   * @throws Error if used in client-side context
   */
  static async validateServerAuth() {
    try {
      const supabase = this.createSecureServerClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('Server auth validation error:', error);
      return null;
    }
  }

  /**
   * Checks if user owns a specific poll
   * @param pollId - The poll ID to check
   * @param userId - The user ID to verify ownership
   * @returns True if user owns the poll
   * @throws Error if used in client-side context
   */
  static async validatePollOwnership(pollId: string, userId: string): Promise<boolean> {
    try {
      if (!this.isValidUUID(pollId) || !this.isValidUUID(userId)) {
        return false;
      }
      
      const supabase = this.createSecureServerClient();
      const { data, error } = await supabase
        .from('polls')
        .select('created_by')
        .eq('id', pollId)
        .single();
      
      if (error || !data) {
        return false;
      }
      
      return data.created_by === userId;
    } catch (error) {
      console.error('Poll ownership validation error:', error);
      return false;
    }
  }

  /**
   * Validates UUID format (delegates to SecurityValidator for consistency)
   * @param id - The UUID to validate
   * @returns True if valid UUID
   */
  static isValidUUID(id: string): boolean {
    return SecurityValidator.isValidUUID(id);
  }
}