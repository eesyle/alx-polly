-- =====================================================
-- ALX POLLY - Supabase Database Schema
-- =====================================================
-- This file contains the complete database schema for the ALX Polly application
-- Run this in your Supabase SQL editor to set up the database

-- =====================================================
-- 1. POLLS TABLE
-- =====================================================
-- Stores the main poll information
CREATE TABLE IF NOT EXISTS polls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL CHECK (length(title) >= 3),
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    allow_multiple_votes BOOLEAN DEFAULT false,
    is_anonymous BOOLEAN DEFAULT false,
    max_votes_per_user INTEGER DEFAULT 1 CHECK (max_votes_per_user > 0)
);

-- =====================================================
-- 2. POLL OPTIONS TABLE
-- =====================================================
-- Stores the available options/choices for each poll
CREATE TABLE IF NOT EXISTS poll_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_text VARCHAR(500) NOT NULL CHECK (length(option_text) >= 1),
    option_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique ordering within each poll
    UNIQUE(poll_id, option_order)
);

-- =====================================================
-- 3. VOTES TABLE
-- =====================================================
-- Stores individual votes cast by users
CREATE TABLE IF NOT EXISTS votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    voter_ip INET, -- For anonymous voting tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate votes (unless poll allows multiple votes)
    UNIQUE(poll_id, user_id, option_id)
);

-- =====================================================
-- 4. POLL VIEWS (for analytics)
-- =====================================================
-- Tracks when users view polls (optional for analytics)
CREATE TABLE IF NOT EXISTS poll_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    viewer_ip INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================
-- Optimize query performance with strategic indexes

-- Index for finding polls by creator
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON polls(created_by);

-- Index for finding active polls
CREATE INDEX IF NOT EXISTS idx_polls_active ON polls(is_active, created_at DESC);

-- Index for poll expiration queries
CREATE INDEX IF NOT EXISTS idx_polls_expires_at ON polls(expires_at) WHERE expires_at IS NOT NULL;

-- Index for poll options by poll
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id, option_order);

-- Index for votes by poll
CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id);

-- Index for votes by user
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id) WHERE user_id IS NOT NULL;

-- Index for vote counting
CREATE INDEX IF NOT EXISTS idx_votes_option_id ON votes(option_id);

-- Index for poll views analytics
CREATE INDEX IF NOT EXISTS idx_poll_views_poll_id ON poll_views(poll_id, created_at DESC);

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Enable RLS on all tables
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_views ENABLE ROW LEVEL SECURITY;

-- POLLS POLICIES
-- Anyone can view active polls
CREATE POLICY "Anyone can view active polls" ON polls
    FOR SELECT USING (is_active = true);

-- Users can view their own polls (including inactive ones)
CREATE POLICY "Users can view own polls" ON polls
    FOR SELECT USING (auth.uid() = created_by);

-- Authenticated users can create polls
CREATE POLICY "Authenticated users can create polls" ON polls
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = created_by);

-- Users can update their own polls
CREATE POLICY "Users can update own polls" ON polls
    FOR UPDATE USING (auth.uid() = created_by);

-- Users can delete their own polls
CREATE POLICY "Users can delete own polls" ON polls
    FOR DELETE USING (auth.uid() = created_by);

-- POLL OPTIONS POLICIES
-- Anyone can view options for active polls
CREATE POLICY "Anyone can view poll options" ON poll_options
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM polls 
            WHERE polls.id = poll_options.poll_id 
            AND polls.is_active = true
        )
    );

-- Poll creators can manage their poll options
CREATE POLICY "Poll creators can manage options" ON poll_options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM polls 
            WHERE polls.id = poll_options.poll_id 
            AND polls.created_by = auth.uid()
        )
    );

-- VOTES POLICIES
-- Users can view vote counts (but not individual votes)
CREATE POLICY "Anyone can view vote counts" ON votes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM polls 
            WHERE polls.id = votes.poll_id 
            AND polls.is_active = true
        )
    );

-- Authenticated users can vote
CREATE POLICY "Authenticated users can vote" ON votes
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM polls 
            WHERE polls.id = poll_id 
            AND polls.is_active = true
            AND (polls.expires_at IS NULL OR polls.expires_at > NOW())
        )
    );

-- Users can view their own votes
CREATE POLICY "Users can view own votes" ON votes
    FOR SELECT USING (auth.uid() = user_id);

-- POLL VIEWS POLICIES
-- Poll creators can view analytics for their polls
CREATE POLICY "Poll creators can view analytics" ON poll_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM polls 
            WHERE polls.id = poll_views.poll_id 
            AND polls.created_by = auth.uid()
        )
    );

-- Anyone can record poll views
CREATE POLICY "Anyone can record poll views" ON poll_views
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- 7. USEFUL VIEWS FOR ANALYTICS
-- =====================================================

-- View to get poll results with vote counts
CREATE OR REPLACE VIEW poll_results AS
SELECT 
    p.id as poll_id,
    p.title,
    p.description,
    p.created_at,
    p.expires_at,
    p.is_active,
    po.id as option_id,
    po.option_text,
    po.option_order,
    COUNT(v.id) as vote_count,
    ROUND(
        (COUNT(v.id)::DECIMAL / NULLIF(total_votes.count, 0)) * 100, 
        2
    ) as vote_percentage
FROM polls p
LEFT JOIN poll_options po ON p.id = po.poll_id
LEFT JOIN votes v ON po.id = v.option_id
LEFT JOIN (
    SELECT 
        poll_id, 
        COUNT(*) as count 
    FROM votes 
    GROUP BY poll_id
) total_votes ON p.id = total_votes.poll_id
GROUP BY p.id, p.title, p.description, p.created_at, p.expires_at, 
         p.is_active, po.id, po.option_text, po.option_order, total_votes.count
ORDER BY p.created_at DESC, po.option_order ASC;

-- View to get user's voting history
CREATE OR REPLACE VIEW user_votes AS
SELECT 
    v.id,
    v.created_at as voted_at,
    p.id as poll_id,
    p.title as poll_title,
    po.option_text as selected_option,
    v.user_id
FROM votes v
JOIN polls p ON v.poll_id = p.id
JOIN poll_options po ON v.option_id = po.id
ORDER BY v.created_at DESC;

-- =====================================================
-- 8. FUNCTIONS FOR COMMON OPERATIONS
-- =====================================================

-- Function to check if user can vote on a poll
CREATE OR REPLACE FUNCTION can_user_vote(poll_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    poll_record polls%ROWTYPE;
    existing_votes INTEGER;
BEGIN
    -- Get poll details
    SELECT * INTO poll_record FROM polls WHERE id = poll_uuid;
    
    -- Check if poll exists and is active
    IF NOT FOUND OR NOT poll_record.is_active THEN
        RETURN FALSE;
    END IF;
    
    -- Check if poll has expired
    IF poll_record.expires_at IS NOT NULL AND poll_record.expires_at < NOW() THEN
        RETURN FALSE;
    END IF;
    
    -- Check existing votes by user
    SELECT COUNT(*) INTO existing_votes 
    FROM votes 
    WHERE poll_id = poll_uuid AND user_id = user_uuid;
    
    -- Check if user has reached vote limit
    IF existing_votes >= poll_record.max_votes_per_user THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get poll statistics
CREATE OR REPLACE FUNCTION get_poll_stats(poll_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_votes', COALESCE(vote_counts.total, 0),
        'total_views', COALESCE(view_counts.total, 0),
        'unique_voters', COALESCE(unique_voters.count, 0),
        'options', option_stats.options
    ) INTO result
    FROM (
        SELECT COUNT(*) as total 
        FROM votes 
        WHERE poll_id = poll_uuid
    ) vote_counts
    CROSS JOIN (
        SELECT COUNT(*) as total 
        FROM poll_views 
        WHERE poll_id = poll_uuid
    ) view_counts
    CROSS JOIN (
        SELECT COUNT(DISTINCT user_id) as count 
        FROM votes 
        WHERE poll_id = poll_uuid AND user_id IS NOT NULL
    ) unique_voters
    CROSS JOIN (
        SELECT json_agg(
            json_build_object(
                'option_id', po.id,
                'option_text', po.option_text,
                'vote_count', COALESCE(vote_counts.count, 0)
            ) ORDER BY po.option_order
        ) as options
        FROM poll_options po
        LEFT JOIN (
            SELECT option_id, COUNT(*) as count
            FROM votes
            WHERE poll_id = poll_uuid
            GROUP BY option_id
        ) vote_counts ON po.id = vote_counts.option_id
        WHERE po.poll_id = poll_uuid
    ) option_stats;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on polls
CREATE TRIGGER update_polls_updated_at 
    BEFORE UPDATE ON polls 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SCHEMA SETUP COMPLETE!
-- =====================================================
-- Your database is now ready for the ALX Polly application!
-- 
-- Next steps:
-- 1. Run this script in your Supabase SQL editor
-- 2. Test the schema by creating sample data
-- 3. Update your application code to use these tables
-- 
-- Happy polling! 🗳️