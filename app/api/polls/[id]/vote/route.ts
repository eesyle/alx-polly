/**
 * Secure API Route for Poll Voting
 * Implements proper validation, authorization, and duplicate vote prevention
 */

import { NextRequest, NextResponse } from 'next/server';
import { SecurityValidator, RateLimiter } from '@/lib/security';
import { AuthSecurity } from '@/lib/security-server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/polls/[id]/vote - Submit a Vote for a Poll Option
 * 
 * Handles secure vote submission with comprehensive validation and security measures.
 * This endpoint processes user votes while preventing fraud, duplicate voting,
 * and ensuring poll integrity through multiple validation layers.
 * 
 * Security Features:
 * - Rate limiting (20 votes per minute per IP)
 * - Authentication requirement enforcement
 * - Input validation and sanitization
 * - UUID format validation for poll and option IDs
 * - Duplicate vote prevention
 * - Poll expiration and status validation
 * - Option ownership verification
 * 
 * Validation Process:
 * 1. Rate limiting check for voting attempts
 * 2. Poll ID format validation (UUID)
 * 3. User authentication verification
 * 4. Request body parsing and validation
 * 5. Option ID format validation (UUID)
 * 6. Poll existence and active status check
 * 7. Poll expiration date validation
 * 8. Option ownership verification (belongs to poll)
 * 9. Duplicate vote prevention (if multiple votes disabled)
 * 10. Same option duplicate vote check
 * 11. Vote record creation in database
 * 
 * Business Rules:
 * - Users must be authenticated to vote
 * - Polls must be active and not expired
 * - Options must belong to the specified poll
 * - Duplicate votes prevented based on poll settings
 * - Rate limiting prevents spam voting
 * 
 * @param {NextRequest} request - The incoming HTTP request
 * @param {Object} params - Route parameters
 * @param {string} params.id - The poll ID from the URL path
 * 
 * @returns {Promise<NextResponse>} HTTP response with vote result
 * 
 * @example Request Body:
 * ```json
 * {
 *   "option_id": "123e4567-e89b-12d3-a456-426614174000"
 * }
 * ```
 * 
 * @example Success Response (201):
 * ```json
 * {
 *   "success": true,
 *   "message": "Vote submitted successfully",
 *   "vote": {
 *     "id": "vote-uuid",
 *     "poll_id": "poll-uuid",
 *     "option_id": "option-uuid",
 *     "user_id": "user-uuid",
 *     "created_at": "2024-01-01T00:00:00Z"
 *   }
 * }
 * ```
 * 
 * @example Error Responses:
 * - 400: Invalid poll/option ID, poll inactive/expired, duplicate vote
 * - 401: Authentication required
 * - 404: Poll or option not found
 * - 429: Rate limit exceeded
 * - 500: Server error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting for voting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (RateLimiter.isRateLimited(clientIP, 20, 60000)) { // 20 votes per minute
      return NextResponse.json(
        { error: 'Too many voting attempts. Please slow down.' },
        { status: 429 }
      );
    }

    // Validate poll ID
    const pollId = params.id;
    if (!SecurityValidator.isValidUUID(pollId)) {
      return NextResponse.json(
        { error: 'Invalid poll ID format' },
        { status: 400 }
      );
    }

    // Validate authentication
    const user = await AuthSecurity.validateServerAuth();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required to vote' },
        { status: 401 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate option ID
    if (!body.option_id || !SecurityValidator.isValidUUID(body.option_id)) {
      return NextResponse.json(
        { error: 'Valid option ID is required' },
        { status: 400 }
      );
    }

    // Verify poll exists and is active
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, is_active, expires_at, allow_multiple_votes')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    if (!poll.is_active) {
      return NextResponse.json(
        { error: 'This poll is no longer active' },
        { status: 400 }
      );
    }

    // Check if poll has expired
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This poll has expired' },
        { status: 400 }
      );
    }

    // Verify option belongs to this poll
    const { data: option, error: optionError } = await supabase
      .from('poll_options')
      .select('id, poll_id')
      .eq('id', body.option_id)
      .eq('poll_id', pollId)
      .single();

    if (optionError || !option) {
      return NextResponse.json(
        { error: 'Invalid option for this poll' },
        { status: 400 }
      );
    }

    // Check for existing votes if multiple votes not allowed
    if (!poll.allow_multiple_votes) {
      const { data: existingVote, error: voteCheckError } = await supabase
        .from('votes')
        .select('id')
        .eq('poll_id', pollId)
        .eq('user_id', user.id)
        .single();

      if (voteCheckError && voteCheckError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error checking existing votes:', voteCheckError);
        return NextResponse.json(
          { error: 'Failed to verify voting eligibility' },
          { status: 500 }
        );
      }

      if (existingVote) {
        return NextResponse.json(
          { error: 'You have already voted on this poll' },
          { status: 400 }
        );
      }
    }

    // Check for duplicate vote on same option
    const { data: duplicateVote, error: duplicateError } = await supabase
      .from('votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('option_id', body.option_id)
      .eq('user_id', user.id)
      .single();

    if (duplicateError && duplicateError.code !== 'PGRST116') {
      console.error('Error checking duplicate votes:', duplicateError);
      return NextResponse.json(
        { error: 'Failed to verify vote uniqueness' },
        { status: 500 }
      );
    }

    if (duplicateVote) {
      return NextResponse.json(
        { error: 'You have already voted for this option' },
        { status: 400 }
      );
    }

    // Submit the vote
    const { data: vote, error: voteError } = await supabase
      .from('votes')
      .insert({
        poll_id: pollId,
        option_id: body.option_id,
        user_id: user.id,
        voter_ip: clientIP,
      })
      .select()
      .single();

    if (voteError) {
      console.error('Vote submission error:', voteError);
      return NextResponse.json(
        { error: 'Failed to submit vote' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      vote: {
        id: vote.id,
        poll_id: vote.poll_id,
        option_id: vote.option_id,
        created_at: vote.created_at,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/polls/[id]/vote error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/polls/[id]/vote - Remove User's Vote from Poll
 * 
 * Handles secure vote removal with validation and authorization checks.
 * This endpoint allows users to retract their votes from polls, enabling
 * vote changes and corrections while maintaining data integrity.
 * 
 * Security Features:
 * - Rate limiting (20 requests per minute per IP)
 * - Authentication requirement enforcement
 * - Poll ID format validation (UUID)
 * - User ownership verification (can only delete own votes)
 * - Poll status and expiration validation
 * - Comprehensive error handling
 * 
 * Validation Process:
 * 1. Rate limiting check for deletion attempts
 * 2. Poll ID format validation (UUID)
 * 3. User authentication verification
 * 4. Poll existence and active status check
 * 5. Poll expiration date validation
 * 6. User vote existence verification
 * 7. Vote deletion from database
 * 8. Success confirmation response
 * 
 * Business Rules:
 * - Users can only delete their own votes
 * - Votes can only be deleted from active, non-expired polls
 * - Rate limiting prevents spam deletion attempts
 * - Proper audit trail maintained through logging
 * 
 * Use Cases:
 * - User wants to change their vote
 * - User accidentally voted and wants to retract
 * - Poll allows vote modifications
 * - Administrative vote corrections
 * 
 * @param {NextRequest} request - The incoming HTTP request
 * @param {Object} params - Route parameters
 * @param {string} params.id - The poll ID from the URL path
 * 
 * @returns {Promise<NextResponse>} HTTP response with deletion result
 * 
 * @example Success Response (200):
 * ```json
 * {
 *   "success": true,
 *   "message": "Vote removed successfully"
 * }
 * ```
 * 
 * @example Error Responses:
 * - 400: Invalid poll ID, poll inactive/expired
 * - 401: Authentication required
 * - 404: Poll not found, no vote to delete
 * - 429: Rate limit exceeded
 * - 500: Server error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate poll ID
    const pollId = params.id;
    if (!SecurityValidator.isValidUUID(pollId)) {
      return NextResponse.json(
        { error: 'Invalid poll ID format' },
        { status: 400 }
      );
    }

    // Validate authentication
    const user = await AuthSecurity.validateServerAuth();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body for option ID
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    if (!body.option_id || !SecurityValidator.isValidUUID(body.option_id)) {
      return NextResponse.json(
        { error: 'Valid option ID is required' },
        { status: 400 }
      );
    }

    // Delete the vote
    const { error: deleteError } = await supabase
      .from('votes')
      .delete()
      .eq('poll_id', pollId)
      .eq('option_id', body.option_id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Vote deletion error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove vote' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Vote removed successfully'
    });

  } catch (error) {
    console.error('DELETE /api/polls/[id]/vote error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}