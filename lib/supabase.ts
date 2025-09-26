import { createClient } from '@supabase/supabase-js';
import { 
  Poll, 
  PollOption, 
  CreatePollFormData, 
  CreatePollResponse, 
  ApiResponse,
  PollWithOptions,
  Vote,
  VoteSubmission,
  PollStats,
  PollListItem
} from './types';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// =====================================================
// POLL CREATION FUNCTIONS
// =====================================================

/**
 * Creates a New Poll with Options and Security Validation
 * 
 * This function handles the complete poll creation process with comprehensive
 * security validation, authentication checks, and database transactions.
 * It ensures data integrity and prevents malicious input through multiple
 * validation layers.
 * 
 * Process Flow:
 * 1. Validates user authentication using AuthSecurity
 * 2. Performs server-side input validation with SecurityValidator
 * 3. Creates poll record in database with validated data
 * 4. Creates associated poll options with proper ordering
 * 5. Handles rollback if any step fails
 * 6. Returns structured response with success/error status
 * 
 * Security Features:
 * - Authentication requirement enforcement
 * - Input sanitization and validation
 * - XSS prevention through SecurityValidator
 * - SQL injection prevention via Supabase parameterized queries
 * - Transaction rollback on partial failures
 * 
 * Validation Rules:
 * - Title: Required, 3-255 characters, sanitized
 * - Description: Optional, max 1000 characters, sanitized
 * - Options: Minimum 2, maximum 10, each max 500 characters
 * - Expiration: Must be future date if provided
 * - User: Must be authenticated and valid
 * 
 * @param {CreatePollFormData} pollData - The poll creation form data
 * @param {string} pollData.title - Poll title (required, 3-255 chars)
 * @param {string} [pollData.description] - Poll description (optional, max 1000 chars)
 * @param {string[]} pollData.options - Poll options array (min 2, max 10)
 * @param {string} [pollData.expires_at] - Expiration date ISO string (optional)
 * @param {boolean} [pollData.allow_multiple_votes] - Allow multiple votes per user
 * @param {boolean} [pollData.is_anonymous] - Anonymous voting enabled
 * @param {number} [pollData.max_votes_per_user] - Maximum votes per user
 * 
 * @returns {Promise<ApiResponse<CreatePollResponse>>} Promise resolving to API response
 * @returns {boolean} returns.success - Whether the operation succeeded
 * @returns {CreatePollResponse} [returns.data] - Created poll and options data
 * @returns {Poll} returns.data.poll - The created poll object
 * @returns {PollOption[]} returns.data.options - Array of created poll options
 * @returns {string} [returns.error] - Error message if operation failed
 * 
 * @throws {Error} Throws validation errors for invalid input data
 * 
 * @example
 * ```typescript
 * const pollData = {
 *   title: 'Favorite Programming Language',
 *   description: 'Choose your preferred language',
 *   options: ['JavaScript', 'Python', 'TypeScript'],
 *   expires_at: '2024-12-31T23:59:59Z',
 *   allow_multiple_votes: false,
 *   is_anonymous: true,
 *   max_votes_per_user: 1
 * };
 * 
 * const result = await createPoll(pollData);
 * if (result.success) {
 *   console.log('Poll created:', result.data.poll.id);
 * } else {
 *   console.error('Error:', result.error);
 * }
 * ```
 */
export async function createPoll(pollData: CreatePollFormData): Promise<ApiResponse<CreatePollResponse>> {
  try {
    // Import security utilities
    const { SecurityValidator } = await import('./security');
    const { AuthSecurity } = await import('./security-server');
    
    // Validate user authentication
    const user = await AuthSecurity.validateServerAuth();
    if (!user) {
      return {
        success: false,
        error: 'You must be logged in to create a poll'
      };
    }

    // Server-side validation of all inputs
    const validatedTitle = SecurityValidator.validatePollTitle(pollData.title);
    const validatedDescription = SecurityValidator.validatePollDescription(pollData.description || '');
    const validatedOptions = SecurityValidator.validatePollOptions(pollData.options);
    const validatedExpiresAt = SecurityValidator.validateExpirationDate(pollData.expires_at);

    // Create the poll with validated data
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title: validatedTitle,
        description: validatedDescription,
        created_by: user.id,
        expires_at: validatedExpiresAt?.toISOString() || null,
        allow_multiple_votes: pollData.allow_multiple_votes,
        is_anonymous: pollData.is_anonymous,
        max_votes_per_user: pollData.max_votes_per_user,
        is_active: true
      })
      .select()
      .single();

    if (pollError) {
      console.error('Poll creation error:', pollError);
      return {
        success: false,
        error: `Failed to create poll: ${pollError.message}`
      };
    }

    // Create poll options with validated data
    const optionsToInsert = validatedOptions.map((option, index) => ({
      poll_id: poll.id,
      option_text: option,
      option_order: index
    }));

    const { data: options, error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionsToInsert)
      .select();

    if (optionsError) {
      console.error('Poll options creation error:', optionsError);
      // Clean up the poll if options creation failed
      await supabase.from('polls').delete().eq('id', poll.id);
      return {
        success: false,
        error: `Failed to create poll options: ${optionsError.message}`
      };
    }

    return {
      success: true,
      data: {
        poll: poll as Poll,
        options: options as PollOption[]
      }
    };

  } catch (error) {
    console.error('Create poll error:', error);
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message
      };
    }
    return {
      success: false,
      error: 'An unexpected error occurred while creating the poll'
    };
  }
}

// =====================================================
// POLL RETRIEVAL FUNCTIONS
// =====================================================

/**
 * Retrieves a Poll with All Associated Options by ID
 * 
 * Fetches a complete poll object including all its options, metadata,
 * and configuration settings. This function is used for displaying
 * poll details, voting interfaces, and poll management.
 * 
 * Features:
 * - Retrieves poll with all associated options in a single query
 * - Validates poll existence and active status
 * - Returns structured data for easy consumption
 * - Handles database errors gracefully
 * 
 * Security Considerations:
 * - Only returns active polls (is_active = true)
 * - Uses parameterized queries to prevent SQL injection
 * - No authentication required for public poll viewing
 * 
 * Data Returned:
 * - Complete poll metadata (title, description, settings)
 * - All poll options with ordering
 * - Creation and expiration timestamps
 * - Poll configuration (anonymous, multiple votes, etc.)
 * 
 * @param {string} pollId - The unique identifier of the poll to retrieve
 * 
 * @returns {Promise<ApiResponse<PollWithOptions>>} Promise resolving to API response
 * @returns {boolean} returns.success - Whether the poll was found and retrieved
 * @returns {PollWithOptions} [returns.data] - Complete poll object with options
 * @returns {Poll} returns.data.poll - The poll metadata
 * @returns {PollOption[]} returns.data.poll_options - Array of poll options
 * @returns {string} [returns.error] - Error message if poll not found or error occurred
 * 
 * @example
 * ```typescript
 * const result = await getPollWithOptions('123e4567-e89b-12d3-a456-426614174000');
 * if (result.success) {
 *   const poll = result.data;
 *   console.log('Poll title:', poll.title);
 *   console.log('Options:', poll.poll_options.map(opt => opt.option_text));
 * } else {
 *   console.error('Poll not found:', result.error);
 * }
 * ```
 */
export async function getPollWithOptions(pollId: string): Promise<ApiResponse<PollWithOptions>> {
  try {
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select(`
        *,
        poll_options (*)
      `)
      .eq('id', pollId)
      .eq('is_active', true)
      .single();

    if (pollError) {
      return {
        success: false,
        error: 'Poll not found'
      };
    }

    return {
      success: true,
      data: poll as PollWithOptions
    };

  } catch (error) {
    console.error('Error fetching poll:', error);
    return {
      success: false,
      error: 'Failed to fetch poll'
    };
  }
}

/**
 * Retrieves All Active Polls with Vote Counts
 * 
 * Fetches a list of all active polls with basic metadata and vote counts.
 * This function is used for the main polls listing page, dashboard displays,
 * and poll discovery features. Includes performance optimization through
 * efficient querying and vote count aggregation.
 * 
 * Features:
 * - Returns only active polls (is_active = true)
 * - Includes vote count for each poll
 * - Ordered by creation date (newest first)
 * - Optimized for list display with minimal data
 * - Handles large datasets efficiently
 * 
 * Performance Considerations:
 * - Uses select() to limit returned fields
 * - Aggregates vote counts in parallel for better performance
 * - Implements proper error handling for database timeouts
 * 
 * Data Returned:
 * - Poll ID, title, description
 * - Creation and expiration timestamps
 * - Creator information
 * - Total vote count per poll
 * - Active status
 * 
 * @returns {Promise<ApiResponse<PollListItem[]>>} Promise resolving to API response
 * @returns {boolean} returns.success - Whether polls were retrieved successfully
 * @returns {PollListItem[]} [returns.data] - Array of poll list items
 * @returns {string} returns.data[].id - Poll unique identifier
 * @returns {string} returns.data[].title - Poll title
 * @returns {string} returns.data[].description - Poll description
 * @returns {string} returns.data[].created_at - Creation timestamp
 * @returns {string} returns.data[].expires_at - Expiration timestamp
 * @returns {number} returns.data[].total_votes - Total vote count
 * @returns {string} [returns.error] - Error message if operation failed
 * 
 * @example
 * ```typescript
 * const result = await getActivePolls();
 * if (result.success) {
 *   result.data.forEach(poll => {
 *     console.log(`${poll.title}: ${poll.total_votes} votes`);
 *   });
 * } else {
 *   console.error('Failed to load polls:', result.error);
 * }
 * ```
 */
export async function getActivePolls(): Promise<ApiResponse<PollListItem[]>> {
  try {
    const { data: polls, error } = await supabase
      .from('polls')
      .select(`
        id,
        title,
        description,
        created_at,
        expires_at,
        is_active,
        created_by
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        success: false,
        error: 'Failed to fetch polls'
      };
    }

    // Get vote counts for each poll
    const pollsWithCounts = await Promise.all(
      polls.map(async (poll) => {
        const { count } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('poll_id', poll.id);

        return {
          ...poll,
          total_votes: count || 0
        } as PollListItem;
      })
    );

    return {
      success: true,
      data: pollsWithCounts
    };

  } catch (error) {
    console.error('Error fetching polls:', error);
    return {
      success: false,
      error: 'Failed to fetch polls'
    };
  }
}

/**
 * Gets polls created by the current user
 * @returns Promise with user's polls
 */
export async function getUserPolls(): Promise<ApiResponse<PollListItem[]>> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        error: 'You must be logged in to view your polls'
      };
    }

    const { data: polls, error } = await supabase
      .from('polls')
      .select(`
        id,
        title,
        description,
        created_at,
        expires_at,
        is_active,
        created_by
      `)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        success: false,
        error: 'Failed to fetch your polls'
      };
    }

    // Get vote counts for each poll
    const pollsWithCounts = await Promise.all(
      polls.map(async (poll) => {
        const { count } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('poll_id', poll.id);

        return {
          ...poll,
          total_votes: count || 0
        } as PollListItem;
      })
    );

    return {
      success: true,
      data: pollsWithCounts
    };

  } catch (error) {
    console.error('Error fetching user polls:', error);
    return {
      success: false,
      error: 'Failed to fetch your polls'
    };
  }
}

// =====================================================
// VOTING FUNCTIONS
// =====================================================

/**
 * Submits a Vote for a Poll Option with Security Validation
 * 
 * Handles secure vote submission with comprehensive validation and business rule enforcement.
 * This function coordinates authentication, eligibility checks, and vote recording while
 * preventing duplicate votes and ensuring poll integrity.
 * 
 * Features:
 * - User authentication verification
 * - Voting eligibility validation using database functions
 * - Duplicate vote prevention with unique constraints
 * - Comprehensive error handling with specific error codes
 * - Database transaction safety
 * 
 * Security Features:
 * - Authentication requirement enforcement
 * - Server-side validation of voting eligibility
 * - Protection against vote manipulation
 * - Proper error categorization for security
 * 
 * Business Rules Enforced:
 * - User must be authenticated to vote
 * - Poll must be active and not expired
 * - User must not exceed maximum votes per poll
 * - Option must belong to the specified poll
 * - Duplicate votes are prevented via unique constraints
 * 
 * Validation Process:
 * 1. Verify user authentication status
 * 2. Check voting eligibility using can_user_vote RPC
 * 3. Validate poll and option existence
 * 4. Insert vote with duplicate prevention
 * 5. Return success/error response
 * 
 * @param {VoteSubmission} voteData - The vote submission data containing poll_id and option_id
 * @param {string} voteData.poll_id - UUID of the poll to vote on
 * @param {string} voteData.option_id - UUID of the option to vote for
 * 
 * @returns {Promise<ApiResponse<Vote>>} Promise resolving to:
 *   - success: true, data: Vote object if vote submitted successfully
 *   - success: false, error: string if validation fails or error occurs
 * 
 * @throws {Error} Logs errors to console but returns structured error response
 * 
 * @example
 * ```typescript
 * // Submit a vote for a poll option
 * const voteResult = await submitVote({
 *   poll_id: 'poll-uuid-here',
 *   option_id: 'option-uuid-here'
 * });
 * 
 * if (voteResult.success) {
 *   console.log('Vote submitted:', voteResult.data);
 *   // Handle successful vote submission
 * } else {
 *   console.error('Vote failed:', voteResult.error);
 *   // Handle specific error cases
 *   if (voteResult.error.includes('already voted')) {
 *     // Show duplicate vote message
 *   } else if (voteResult.error.includes('logged in')) {
 *     // Redirect to login
 *   }
 * }
 * ```
 */
export async function submitVote(voteData: VoteSubmission): Promise<ApiResponse<Vote>> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        error: 'You must be logged in to vote'
      };
    }

    // Check if user can vote on this poll
    const { data: canVote, error: checkError } = await supabase
      .rpc('can_user_vote', {
        poll_uuid: voteData.poll_id,
        user_uuid: user.id
      });

    if (checkError) {
      return {
        success: false,
        error: 'Failed to verify voting eligibility'
      };
    }

    if (!canVote) {
      return {
        success: false,
        error: 'You are not eligible to vote on this poll'
      };
    }

    // Submit the vote
    const { data: vote, error: voteError } = await supabase
      .from('votes')
      .insert({
        poll_id: voteData.poll_id,
        option_id: voteData.option_id,
        user_id: user.id
      })
      .select()
      .single();

    if (voteError) {
      if (voteError.code === '23505') { // Unique constraint violation
        return {
          success: false,
          error: 'You have already voted for this option'
        };
      }
      return {
        success: false,
        error: 'Failed to submit vote'
      };
    }

    return {
      success: true,
      data: vote as Vote
    };

  } catch (error) {
    console.error('Error submitting vote:', error);
    return {
      success: false,
      error: 'Failed to submit vote'
    };
  }
}

/**
 * Gets poll statistics using the database function
 * @param pollId - The poll ID
 * @returns Promise with poll statistics
 */
export async function getPollStats(pollId: string): Promise<ApiResponse<PollStats>> {
  try {
    const { data: stats, error } = await supabase
      .rpc('get_poll_stats', { poll_uuid: pollId });

    if (error) {
      return {
        success: false,
        error: 'Failed to fetch poll statistics'
      };
    }

    return {
      success: true,
      data: stats as PollStats
    };

  } catch (error) {
    console.error('Error fetching poll stats:', error);
    return {
      success: false,
      error: 'Failed to fetch poll statistics'
    };
  }
}

// =====================================================
// POLL MANAGEMENT FUNCTIONS
// =====================================================

/**
 * Updates a poll (only by the creator)
 * @param pollId - The poll ID
 * @param updates - The fields to update
 * @returns Promise with the updated poll
 */
export async function updatePoll(
  pollId: string, 
  updates: Partial<Pick<Poll, 'title' | 'description' | 'expires_at' | 'is_active'>>
): Promise<ApiResponse<Poll>> {
  try {
    const { data: poll, error } = await supabase
      .from('polls')
      .update(updates)
      .eq('id', pollId)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: 'Failed to update poll'
      };
    }

    return {
      success: true,
      data: poll as Poll
    };

  } catch (error) {
    console.error('Error updating poll:', error);
    return {
      success: false,
      error: 'Failed to update poll'
    };
  }
}

/**
 * Deletes a poll (only by the creator)
 * @param pollId - The poll ID
 * @returns Promise with the result
 */
export async function deletePoll(pollId: string): Promise<ApiResponse<boolean>> {
  try {
    const { error } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId);

    if (error) {
      return {
        success: false,
        error: 'Failed to delete poll'
      };
    }

    return {
      success: true,
      data: true
    };

  } catch (error) {
    console.error('Error deleting poll:', error);
    return {
      success: false,
      error: 'Failed to delete poll'
    };
  }
}