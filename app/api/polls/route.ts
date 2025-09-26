/**
 * Secure API Routes for Poll Operations
 * Implements proper validation, authorization, and error handling
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
 * GET /api/polls - Retrieve polls with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50); // Max 50 items
    const search = searchParams.get('search') || '';
    
    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Build query with security considerations
    let query = supabase
      .from('polls')
      .select(`
        id,
        title,
        description,
        created_at,
        expires_at,
        is_active,
        created_by,
        poll_options (
          id,
          option_text,
          option_order
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Add search filter if provided
    if (search.trim()) {
      const sanitizedSearch = search.trim().substring(0, 100); // Limit search length
      query = query.ilike('title', `%${sanitizedSearch}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data: polls, error } = await query;

    if (error) {
      console.error('Error fetching polls:', error);
      return NextResponse.json(
        { error: 'Failed to fetch polls' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      polls: polls || [],
      pagination: {
        page,
        limit,
        hasMore: polls?.length === limit
      }
    });

  } catch (error) {
    console.error('GET /api/polls error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/polls - Create a new poll with validation
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (RateLimiter.isRateLimited(clientIP, 5, 300000)) { // 5 polls per 5 minutes
      return NextResponse.json(
        { error: 'Too many poll creation attempts. Please try again later.' },
        { status: 429 }
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

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.title || !body.description || !Array.isArray(body.options)) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, options' },
        { status: 400 }
      );
    }

    // Server-side validation using SecurityValidator
    const validatedTitle = SecurityValidator.validatePollTitle(body.title);
    const validatedDescription = SecurityValidator.validatePollDescription(body.description);
    const validatedOptions = SecurityValidator.validatePollOptions(body.options);
    const validatedExpiresAt = SecurityValidator.validateExpirationDate(body.expires_at);

    // Create poll in database
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title: validatedTitle,
        description: validatedDescription,
        created_by: user.id,
        expires_at: validatedExpiresAt?.toISOString() || null,
        is_active: true,
        allow_multiple_votes: Boolean(body.allow_multiple_votes),
        is_anonymous: Boolean(body.is_anonymous),
      })
      .select()
      .single();

    if (pollError) {
      console.error('Poll creation error:', pollError);
      return NextResponse.json(
        { error: 'Failed to create poll' },
        { status: 500 }
      );
    }

    // Create poll options
    const optionsData = validatedOptions.map((option, index) => ({
      poll_id: poll.id,
      option_text: option,
      option_order: index,
    }));

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionsData);

    if (optionsError) {
      console.error('Poll options creation error:', optionsError);
      // Clean up poll if options creation fails
      await supabase.from('polls').delete().eq('id', poll.id);
      return NextResponse.json(
        { error: 'Failed to create poll options' },
        { status: 500 }
      );
    }

    // Return created poll
    return NextResponse.json({
      success: true,
      poll: {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        created_at: poll.created_at,
        expires_at: poll.expires_at,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/polls error:', error);
    
    // Handle validation errors
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}