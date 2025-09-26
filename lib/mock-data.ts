/**
 * Mock Data for Development and Testing
 * Centralized location for all mock data used in the application
 */

import { PollListItem } from '@/lib/types';

/**
 * Mock polls data for development and testing
 * Uses proper TypeScript interfaces for type safety
 */
export const mockPolls: PollListItem[] = [
  {
    id: "1",
    title: "Favorite Programming Language",
    description: "What's your favorite programming language for web development?",
    total_votes: 42,
    created_at: "2023-05-15T10:30:00Z",
    expires_at: "2024-05-15T10:30:00Z",
    is_active: true,
    created_by: "user-1",
    creator_name: "John Doe"
  },
  {
    id: "2", 
    title: "Best Frontend Framework",
    description: "Which frontend framework do you prefer for building modern web applications?",
    total_votes: 38,
    created_at: "2023-05-20T14:15:00Z",
    expires_at: "2024-05-20T14:15:00Z",
    is_active: true,
    created_by: "user-2",
    creator_name: "Jane Smith"
  },
  {
    id: "3",
    title: "Database Preference",
    description: "Which database do you use most often for your projects?",
    total_votes: 27,
    created_at: "2023-05-25T09:45:00Z",
    is_active: true,
    created_by: "user-3",
    creator_name: "Bob Johnson"
  },
  {
    id: "4",
    title: "Deployment Platform",
    description: "What's your preferred platform for deploying web applications?",
    total_votes: 15,
    created_at: "2023-06-01T16:20:00Z",
    expires_at: "2024-06-01T16:20:00Z",
    is_active: true,
    created_by: "user-1",
    creator_name: "John Doe"
  }
];

/**
 * Get mock polls with optional filtering
 * @param activeOnly - Filter to only active polls
 * @returns Array of poll list items
 */
export const getMockPolls = (activeOnly: boolean = false): PollListItem[] => {
  if (activeOnly) {
    return mockPolls.filter(poll => poll.is_active);
  }
  return mockPolls;
};

/**
 * Get a single mock poll by ID
 * @param id - Poll ID to find
 * @returns Poll list item or undefined
 */
export const getMockPollById = (id: string): PollListItem | undefined => {
  return mockPolls.find(poll => poll.id === id);
};