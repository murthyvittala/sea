-- =====================================================
-- AI Analytics Agent Database Setup
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Schema Registry Table
-- Stores compressed table metadata for token-efficient LLM queries
-- =====================================================
CREATE TABLE IF NOT EXISTS schema_registry (
    id SERIAL PRIMARY KEY,
    table_name TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,              -- Brief description (~10 words)
    columns JSONB NOT NULL,                 -- [{name, type, desc}] - keep desc short
    keywords TEXT[] NOT NULL DEFAULT '{}',  -- For matching user questions
    sample_queries JSONB DEFAULT '[]',      -- Optional example queries
    is_active BOOLEAN DEFAULT true,         -- Enable/disable for AI
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for keyword search
CREATE INDEX IF NOT EXISTS idx_schema_registry_keywords ON schema_registry USING GIN(keywords);

COMMENT ON TABLE schema_registry IS 'Stores table schemas for AI agent - manually maintained';
COMMENT ON COLUMN schema_registry.keywords IS 'Keywords for matching user questions to relevant tables';


-- 2. AI Conversations Table  
-- Stores chat history for fine-tuning and debugging
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,               -- Groups messages in a conversation
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,                  -- User question or AI response
    sql_generated TEXT,                     -- SQL query if generated
    query_results JSONB,                    -- Query results (truncated if large)
    chart_type TEXT,                        -- bar, pie, line, etc.
    tokens_used INTEGER,                    -- For cost tracking
    model_used TEXT,                        -- gpt-4o, claude-3, etc.
    provider TEXT,                          -- openai, anthropic, google
    latency_ms INTEGER,                     -- Response time
    error TEXT,                             -- Error message if failed
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for querying conversations
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created ON ai_conversations(created_at);

COMMENT ON TABLE ai_conversations IS 'Stores AI chat history for fine-tuning and analytics';


-- 3. Add LLM Configuration to Users Table
-- =====================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS llm_provider TEXT DEFAULT 'openai';
ALTER TABLE users ADD COLUMN IF NOT EXISTS llm_model TEXT DEFAULT 'gpt-4o-mini';
ALTER TABLE users ADD COLUMN IF NOT EXISTS llm_api_key_encrypted TEXT;

COMMENT ON COLUMN users.llm_provider IS 'LLM provider: openai, anthropic, google';
COMMENT ON COLUMN users.llm_model IS 'Model identifier: gpt-4o, claude-3-sonnet, etc.';
COMMENT ON COLUMN users.llm_api_key_encrypted IS 'AES-256-GCM encrypted API key';


-- 4. Create Read-Only Role for AI Agent
-- This role can ONLY run SELECT queries
-- =====================================================
DO $$
BEGIN
    -- Create role if not exists
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'readonly_agent') THEN
        CREATE ROLE readonly_agent NOLOGIN;
    END IF;
END
$$;

-- Grant SELECT only on specific tables
GRANT SELECT ON schema_registry TO readonly_agent;
GRANT SELECT ON ai_conversations TO readonly_agent;

-- Grant SELECT on analytics tables (add more as needed)
-- Uncomment these when ga_data and gsc_data tables exist:
-- GRANT SELECT ON ga_data TO readonly_agent;
-- GRANT SELECT ON gsc_data TO readonly_agent;

COMMENT ON ROLE readonly_agent IS 'Read-only role for AI agent SQL execution';


-- 5. Row Level Security for AI Conversations
-- Users can only see their own conversations
-- =====================================================
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
    ON ai_conversations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
    ON ai_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);


-- 6. Seed Initial Schema Registry Data
-- Add your existing tables here
-- =====================================================
INSERT INTO schema_registry (table_name, description, columns, keywords) VALUES
(
    'users',
    'User profiles with settings and API configurations',
    '[
        {"name": "id", "type": "uuid", "desc": "User ID - primary key"},
        {"name": "email", "type": "text", "desc": "User email"},
        {"name": "plan", "type": "text", "desc": "Subscription: free, pro, enterprise"},
        {"name": "website_url", "type": "text", "desc": "Tracked website URL"},
        {"name": "ga4_property_id", "type": "text", "desc": "Google Analytics property"},
        {"name": "gsc_site_url", "type": "text", "desc": "Search Console site"}
    ]'::jsonb,
    ARRAY['user', 'profile', 'plan', 'subscription', 'website', 'account']
)
ON CONFLICT (table_name) DO UPDATE SET
    columns = EXCLUDED.columns,
    keywords = EXCLUDED.keywords,
    updated_at = NOW();

-- Placeholder for ga_data - update when table exists
INSERT INTO schema_registry (table_name, description, columns, keywords, is_active) VALUES
(
    'ga_data',
    'Google Analytics 4 daily traffic metrics',
    '[
        {"name": "id", "type": "bigint", "desc": "Primary key"},
        {"name": "user_id", "type": "uuid", "desc": "Owner - ALWAYS filter by this"},
        {"name": "date", "type": "date", "desc": "Metric date"},
        {"name": "sessions", "type": "int", "desc": "Total sessions"},
        {"name": "users", "type": "int", "desc": "Active users count"},
        {"name": "pageviews", "type": "int", "desc": "Page views"},
        {"name": "bounce_rate", "type": "float", "desc": "Bounce rate percentage"},
        {"name": "avg_session_duration", "type": "float", "desc": "Avg session seconds"},
        {"name": "country", "type": "text", "desc": "Visitor country"},
        {"name": "city", "type": "text", "desc": "Visitor city"},
        {"name": "source", "type": "text", "desc": "Traffic source"},
        {"name": "medium", "type": "text", "desc": "Traffic medium"}
    ]'::jsonb,
    ARRAY['traffic', 'sessions', 'users', 'pageviews', 'analytics', 'visitors', 'country', 'location', 'source', 'medium', 'bounce'],
    false  -- Set to true when table exists
)
ON CONFLICT (table_name) DO UPDATE SET
    columns = EXCLUDED.columns,
    keywords = EXCLUDED.keywords,
    updated_at = NOW();

-- Placeholder for gsc_data - update when table exists
INSERT INTO schema_registry (table_name, description, columns, keywords, is_active) VALUES
(
    'gsc_data',
    'Google Search Console keyword and page performance',
    '[
        {"name": "id", "type": "bigint", "desc": "Primary key"},
        {"name": "user_id", "type": "uuid", "desc": "Owner - ALWAYS filter by this"},
        {"name": "date", "type": "date", "desc": "Metric date"},
        {"name": "query", "type": "text", "desc": "Search keyword/query"},
        {"name": "page", "type": "text", "desc": "Landing page URL"},
        {"name": "clicks", "type": "int", "desc": "Total clicks"},
        {"name": "impressions", "type": "int", "desc": "Search impressions"},
        {"name": "ctr", "type": "float", "desc": "Click-through rate"},
        {"name": "position", "type": "float", "desc": "Average ranking position"},
        {"name": "country", "type": "text", "desc": "Searcher country"},
        {"name": "device", "type": "text", "desc": "Device: mobile, desktop, tablet"}
    ]'::jsonb,
    ARRAY['keywords', 'search', 'ranking', 'position', 'clicks', 'impressions', 'ctr', 'seo', 'queries', 'pages', 'urls', 'country', 'device'],
    false  -- Set to true when table exists
)
ON CONFLICT (table_name) DO UPDATE SET
    columns = EXCLUDED.columns,
    keywords = EXCLUDED.keywords,
    updated_at = NOW();


-- 7. Helper function to get schemas by keywords
-- =====================================================
CREATE OR REPLACE FUNCTION get_schemas_by_keywords(search_keywords TEXT[])
RETURNS TABLE (
    table_name TEXT,
    description TEXT,
    columns JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sr.table_name,
        sr.description,
        sr.columns
    FROM schema_registry sr
    WHERE sr.is_active = true
    AND sr.keywords && search_keywords  -- Array overlap
    ORDER BY 
        array_length(array(SELECT unnest(sr.keywords) INTERSECT SELECT unnest(search_keywords)), 1) DESC NULLS LAST
    LIMIT 3;  -- Max 3 tables per query for token efficiency
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- MANUAL SCHEMA MANAGEMENT INSTRUCTIONS
-- =====================================================
-- 
-- TO ADD A NEW TABLE:
-- INSERT INTO schema_registry (table_name, description, columns, keywords) VALUES (
--     'your_table_name',
--     'Brief description under 15 words',
--     '[
--         {"name": "column1", "type": "text", "desc": "Short desc"},
--         {"name": "column2", "type": "int", "desc": "Short desc"}
--     ]'::jsonb,
--     ARRAY['keyword1', 'keyword2', 'keyword3']
-- );
--
-- TO UPDATE A TABLE:
-- UPDATE schema_registry 
-- SET columns = '[...]'::jsonb, 
--     keywords = ARRAY['...'],
--     updated_at = NOW()
-- WHERE table_name = 'your_table';
--
-- TO ENABLE/DISABLE A TABLE:
-- UPDATE schema_registry SET is_active = true WHERE table_name = 'ga_data';
--
-- TO VIEW ALL SCHEMAS:
-- SELECT table_name, description, is_active, 
--        jsonb_array_length(columns) as column_count
-- FROM schema_registry;
-- =====================================================
