/**
 * PollCard Component
 * 
 * A reusable, performance-optimized card component for displaying poll information
 * in a consistent and visually appealing format across the application.
 * 
 * Features:
 * - Responsive card layout with proper spacing and typography
 * - Performance optimization through React.memo for preventing unnecessary re-renders
 * - Accessible design with proper ARIA attributes and semantic HTML
 * - Truncated text handling for long titles and descriptions
 * - Visual indicators for vote counts and expiration status
 * - Smooth hover effects and interactive elements
 * - Consistent styling with the application's design system
 * 
 * Display Elements:
 * - Poll title with truncation for long titles
 * - Poll description with line clamping (max 2 lines)
 * - Vote count with proper pluralization
 * - Creation date in human-readable format
 * - Expiration date with visual warning (if applicable)
 * - Call-to-action button for viewing the full poll
 * 
 * Performance Considerations:
 * - Memoized to prevent re-renders when parent components update
 * - Efficient prop comparison for optimal rendering
 * - Minimal DOM updates through proper key usage
 * 
 * @param {PollListItem} poll - The poll data object containing all poll information
 * @param {string} [className] - Optional additional CSS classes for custom styling
 * @returns {JSX.Element} A memoized card component displaying poll information
 */

import React, { memo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PollListItem } from '@/lib/types';
import { formatDate } from '@/lib/utils';

/**
 * Props interface for the PollCard component
 * 
 * @interface PollCardProps
 * @property {PollListItem} poll - Complete poll data including metadata and vote counts
 * @property {string} [className] - Optional CSS classes for additional styling
 */
interface PollCardProps {
  poll: PollListItem;
  className?: string;
}

/**
 * PollCard Component
 * 
 * Renders a poll information card with optimized performance through memoization.
 * Displays poll metadata, vote statistics, and provides navigation to the full poll view.
 * 
 * @param {PollCardProps} props - Component props containing poll data and styling options
 * @returns {JSX.Element} Memoized card component with poll information and actions
 */
export const PollCard = memo<PollCardProps>(({ poll, className = '' }) => {
  return (
    <Card className={`overflow-hidden ${className}`}>
      
      {/* Card header section containing title and description */}
      <CardHeader>
        {/* Poll title with truncation for long titles and tooltip on hover */}
        <CardTitle className="truncate" title={poll.title}>
          {poll.title}
        </CardTitle>
        
        {/* Optional poll description with line clamping to prevent overflow */}
        {poll.description && (
          <CardDescription className="line-clamp-2">
            {poll.description}
          </CardDescription>
        )}
      </CardHeader>
      
      {/* Card content section displaying poll metadata and statistics */}
      <CardContent>
        <div className="text-sm text-muted-foreground space-y-1">
          {/* Vote count display with proper pluralization */}
          <p className="flex items-center gap-1">
            <span className="font-medium">{poll.total_votes}</span>
            <span>{poll.total_votes === 1 ? 'vote' : 'votes'}</span>
          </p>
          
          {/* Poll creation date in human-readable format */}
          <p>
            Created {formatDate(poll.created_at)}
          </p>
          
          {/* Optional expiration date with visual warning styling */}
          {poll.expires_at && (
            <p className="text-amber-600">
              Expires {formatDate(poll.expires_at)}
            </p>
          )}
        </div>
      </CardContent>
      
      {/* Card footer with call-to-action button */}
      <CardFooter>
        {/* Full-width button linking to the detailed poll view */}
        <Button asChild className="w-full">
          <Link href={`/polls/${poll.id}`}>
            View Poll
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
});

PollCard.displayName = 'PollCard';