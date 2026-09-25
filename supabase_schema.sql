-- =============================================================
-- MindHealth AI - Supabase Mental Health Assessments Schema
-- Run this script in the Supabase Dashboard -> SQL Editor
-- =============================================================

-- 1. Create the mental_health_assessments table
CREATE TABLE IF NOT EXISTS mental_health_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    input_data JSONB NOT NULL,
    prediction TEXT,
    status TEXT DEFAULT 'processing',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create index on user_id for fast queries
CREATE INDEX IF NOT EXISTS mental_health_assessments_user_id_idx
ON mental_health_assessments(user_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE mental_health_assessments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy: Users can select only their own assessment records
CREATE POLICY "Users can view their own assessments"
ON mental_health_assessments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 5. RLS Policy: Users can insert their own assessments
CREATE POLICY "Users can insert their own assessments"
ON mental_health_assessments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 6. RLS Policy: Users can update their own assessments
CREATE POLICY "Users can update their own assessments"
ON mental_health_assessments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
