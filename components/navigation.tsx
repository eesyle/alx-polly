/**
 * Main Navigation Component
 * 
 * Provides the primary navigation interface for the ALX Polly application.
 * Features responsive design, authentication-aware navigation, and user profile management.
 * 
 * Features:
 * - Responsive navigation with mobile-friendly design
 * - Authentication-aware menu items and user states
 * - User profile integration with avatar display
 * - Secure sign-out functionality with proper cleanup
 * - Conditional navigation based on user authentication status
 * - Smooth transitions and hover effects
 * 
 * Navigation Structure:
 * - Brand logo/name linking to home page
 * - Public navigation: Polls listing
 * - Authenticated navigation: Create Poll, Profile
 * - Authentication actions: Login/Register or Profile/Sign Out
 * 
 * Security Features:
 * - Proper authentication state management
 * - Secure sign-out with session cleanup
 * - Protected route access based on authentication
 * 
 * @returns {JSX.Element} The main navigation header component
 */

'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

/**
 * Navigation Component
 * 
 * Renders the main application navigation with authentication-aware interface.
 * Handles user authentication state and provides appropriate navigation options.
 * 
 * @returns {JSX.Element} Complete navigation header with responsive design
 */
export function Navigation() {
  // Authentication context for user state and sign-out functionality
  const { user, signOut } = useAuth();
  const router = useRouter();

  /**
   * Handles User Sign Out Process
   * 
   * Securely signs out the user and redirects to home page.
   * Ensures proper session cleanup and state management.
   * 
   * @returns {Promise<void>} Promise that resolves when sign-out is complete
   */
  const handleSignOut = async () => {
    await signOut();  // Clear authentication state and session
    router.push('/'); // Redirect to home page after sign-out
  };

  return (
    <>
      {/* Main navigation header with border and background styling */}
      <header className="border-b bg-background">

      {/* Container with responsive layout and proper spacing */}
      <div className="container flex h-16 items-center justify-between">
        
        {/* Left section: Brand logo and main navigation links */}
        <div className="flex items-center gap-6">
          {/* Brand logo/name linking to home page */}
          <Link href="/" className="font-semibold text-lg">
            ALX Polly
          </Link>
          
          {/* Main navigation menu - hidden on mobile, visible on medium+ screens */}
          <nav className="hidden md:flex gap-6">
            {/* Public navigation: Polls listing available to all users */}
            <Link href="/polls" className="text-muted-foreground hover:text-foreground transition-colors">
              Polls
            </Link>
            
            {/* Protected navigation: Create Poll only visible to authenticated users */}
            {user && (
              <Link href="/polls/create" className="text-muted-foreground hover:text-foreground transition-colors">
                Create Poll
              </Link>
            )}
          </nav>
        </div>
        
        {/* Right section: Authentication-based action buttons */}
        <div className="flex items-center gap-4">
          {/* Unauthenticated user state: Show Login and Register buttons */}
          {!user ? (
            <>
              {/* Login button with outline styling */}
              <Button variant="outline" asChild>
                <Link href="/auth/login">Login</Link>
              </Button>
              
              {/* Register button with primary styling */}
              <Button asChild>
                <Link href="/auth/register">Register</Link>
              </Button>
            </>
          ) : (
            /* Authenticated user state: Show Profile and Sign Out options */
            <div className="flex items-center gap-4">
              {/* Profile button with user avatar and responsive text */}
              <Button variant="ghost" asChild>
                <Link href="/auth/profile" className="flex items-center gap-2">
                  {/* User avatar with fallback initials */}
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {/* Display first 2 characters of email as avatar fallback */}
                      {user.email?.substring(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {/* Profile text - hidden on mobile, visible on medium+ screens */}
                  <span className="hidden md:inline">Profile</span>
                </Link>
              </Button>
              
              {/* Sign out button with secure logout functionality */}
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
    </>
  );
}