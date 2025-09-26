/**
 * TypeScript interfaces for ALX Polly application
 * These types match the database schema and provide type safety
 */

// Database table types matching our Supabase schema
export interface Poll {
  id: string;
  title: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  is_active: boolean;
  allow_multiple_votes: boolean;
  is_anonymous: boolean;
  max_votes_per_user: number;
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  option_order: number;
  created_at: string;
}

export interface Vote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id?: string;
  voter_ip?: string;
  created_at: string;
}

export interface PollView {
  id: string;
  poll_id: string;
  user_id?: string;
  viewer_ip?: string;
  created_at: string;
}

// Form types for creating polls
export interface CreatePollFormData {
  title: string;
  description?: string;
  options: string[];
  expires_at?: string;
  allow_multiple_votes: boolean;
  is_anonymous: boolean;
  max_votes_per_user: number;
}

// API response types
export interface PollWithOptions extends Poll {
  poll_options: PollOption[];
}

export interface PollResult {
  poll_id: string;
  title: string;
  description?: string;
  created_at: string;
  expires_at?: string;
  is_active: boolean;
  option_id: string;
  option_text: string;
  option_order: number;
  vote_count: number;
  vote_percentage: number;
}

export interface UserVote {
  id: string;
  voted_at: string;
  poll_id: string;
  poll_title: string;
  selected_option: string;
  user_id: string;
}

export interface PollStats {
  total_votes: number;
  total_views: number;
  unique_voters: number;
  options: Array<{
    option_id: string;
    option_text: string;
    vote_count: number;
  }>;
}

// Form validation types
export interface PollFormErrors {
  title?: string;
  description?: string;
  options?: string[];
  expires_at?: string;
  max_votes_per_user?: string;
  general?: string;
}

// API response wrapper
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// Voting types
export interface VoteSubmission {
  poll_id: string;
  option_id: string;
  user_id: string;
}

// Poll creation response
export interface CreatePollResponse {
  poll: Poll;
  options: PollOption[];
}

// Poll list item for displaying in lists
export interface PollListItem {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  expires_at?: string;
  is_active: boolean;
  total_votes: number;
  created_by: string;
  creator_name?: string; // If we join with user profiles
}

// Enums for better type safety
export enum PollStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  INACTIVE = 'inactive'
}

export enum VoteType {
  SINGLE = 'single',
  MULTIPLE = 'multiple'
}

// Utility types
export type PollId = string;
export type UserId = string;
export type OptionId = string;

// Form state types
export interface PollFormState {
  isLoading: boolean;
  errors: PollFormErrors;
  isSubmitted: boolean;
}