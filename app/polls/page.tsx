'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getMockPolls } from '@/lib/mock-data';
import { formatRelativeTime } from '@/lib/utils';
import type { PollListItem } from '@/lib/types';

/**
 * Individual Poll Card Component
 * Extracted for better reusability and maintainability
 */
interface PollCardProps {
  poll: PollListItem;
}

function PollCard({ poll }: PollCardProps) {
  // Memoize the formatted date to avoid recalculation on every render
  const formattedDate = useMemo(() => formatRelativeTime(poll.created_at), [poll.created_at]);
  
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="text-lg line-clamp-2">{poll.title}</CardTitle>
        <CardDescription className="line-clamp-3">{poll.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {poll.total_votes} votes • {formattedDate}
          </span>
          <Link href={`/polls/${poll.id}`}>
            <Button variant="outline" size="sm">
              View Poll
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Polls Page Component
 * Displays a list of available polls with improved performance and readability
 */
export default function PollsPage() {
  // Memoize the polls data to prevent unnecessary re-fetching
  const polls = useMemo(() => getMockPolls(true), []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Polls</h1>
          <p className="text-muted-foreground mt-2">
            Discover and participate in community polls
          </p>
        </div>
        <Link href="/polls/create">
          <Button>Create Poll</Button>
        </Link>
      </div>
      
      {polls.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No polls available yet.</p>
          <Link href="/polls/create">
            <Button>Create the first poll</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll) => (
            <PollCard key={poll.id} poll={poll} />
          ))}
        </div>
      )}
    </div>
  );
}