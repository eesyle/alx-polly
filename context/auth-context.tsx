'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Session, User } from '@supabase/supabase-js';

/**
 * Authentication Context Type Definition
 * 
 * Defines the shape of the authentication context that provides
 * user session management and authentication methods throughout the app.
 */
type AuthContextType = {
  /** Current authenticated user object from Supabase */
  user: User | null;
  /** Current session object containing auth tokens and metadata */
  session: Session | null;
  /** Loading state indicator for authentication operations */
  isLoading: boolean;
  /** 
   * Sign in method for existing users
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise with error object if authentication fails
   */
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  /** 
   * Sign up method for new user registration
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise with user data and error object
   */
  signUp: (email: string, password: string) => Promise<{ error: any, data: any }>;
  /** 
   * Sign out method to end user session
   * @returns Promise that resolves when sign out is complete
   */
  signOut: () => Promise<void>;
};

/**
 * Authentication Context
 * 
 * React context for managing authentication state across the application.
 * Provides user session data and authentication methods to child components.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider Component
 * 
 * Provides authentication context to the entire application. Manages user session state,
 * handles authentication state changes, and provides authentication methods to child components.
 * 
 * Features:
 * - Automatic session restoration on app load
 * - Real-time authentication state synchronization
 * - Centralized authentication methods (sign in, sign up, sign out)
 * - Loading state management for better UX
 * 
 * @param children - React components that will have access to authentication context
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Authentication state management
  const [user, setUser] = useState<User | null>(null);           // Current authenticated user
  const [session, setSession] = useState<Session | null>(null);   // Current session with tokens
  const [isLoading, setIsLoading] = useState(true);              // Loading state for auth operations

  useEffect(() => {
    /**
     * Initialize Authentication Session
     * 
     * Retrieves the current session from Supabase storage (localStorage/sessionStorage)
     * and sets the initial authentication state. This ensures users remain logged in
     * across browser sessions and page refreshes.
     */
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error.message);
        // Continue with null session if there's an error
      }
      
      // Set session and user state from retrieved data
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsLoading(false); // Authentication initialization complete
    };

    // Initialize session on component mount
    getSession();

    /**
     * Authentication State Change Listener
     * 
     * Subscribes to Supabase auth state changes to keep the application
     * synchronized with authentication events like:
     * - User signs in/out
     * - Session expires
     * - Token refresh
     * - Password reset completion
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Update local state to match Supabase auth state
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false); // Ensure loading state is cleared
      }
    );

    // Cleanup: Unsubscribe from auth state changes when component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - run once on mount

  /**
   * User Sign In Method
   * 
   * Authenticates an existing user with email and password credentials.
   * Uses Supabase's signInWithPassword method for secure authentication.
   * 
   * @param email - User's registered email address
   * @param password - User's password
   * @returns Promise containing error object if authentication fails, null if successful
   * 
   * @example
   * ```typescript
   * const { signIn } = useAuth();
   * const { error } = await signIn('user@example.com', 'password123');
   * if (error) {
   *   console.error('Sign in failed:', error.message);
   * }
   * ```
   */
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  /**
   * User Registration Method
   * 
   * Creates a new user account with email and password credentials.
   * Sends a confirmation email if email confirmation is enabled in Supabase.
   * 
   * @param email - New user's email address
   * @param password - New user's password (should meet security requirements)
   * @returns Promise containing user data and error object
   * 
   * @example
   * ```typescript
   * const { signUp } = useAuth();
   * const { data, error } = await signUp('newuser@example.com', 'securePassword123');
   * if (error) {
   *   console.error('Sign up failed:', error.message);
   * } else {
   *   console.log('User created:', data.user);
   * }
   * ```
   */
  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error };
  };

  /**
   * User Sign Out Method
   * 
   * Ends the current user session and clears authentication state.
   * Removes session tokens from storage and triggers auth state change.
   * 
   * @example
   * ```typescript
   * const { signOut } = useAuth();
   * await signOut();
   * // User is now signed out and redirected to public pages
   * ```
   */
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Context value object containing all authentication state and methods
  const value = {
    user,        // Current authenticated user
    session,     // Current session with tokens
    isLoading,   // Loading state for auth operations
    signIn,      // Sign in method
    signUp,      // Sign up method
    signOut,     // Sign out method
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Authentication Hook
 * 
 * Custom React hook that provides access to authentication context.
 * Must be used within an AuthProvider component tree.
 * 
 * @returns AuthContextType object containing user state and authentication methods
 * @throws Error if used outside of AuthProvider
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { user, isLoading, signIn, signOut } = useAuth();
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   
 *   return (
 *     <div>
 *       {user ? (
 *         <button onClick={signOut}>Sign Out</button>
 *       ) : (
 *         <button onClick={() => signIn(email, password)}>Sign In</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  // Ensure hook is used within AuthProvider
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}