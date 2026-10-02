-- =============================================================
-- MindHealth AI - Supabase Production Schema & Permissions Script
-- Copy and paste this ENTIRE script into Supabase SQL Editor and click "RUN"
-- =============================================================

-- -------------------------------------------------------------
-- STEP 1: Grant Schema & Object Permissions to Supabase Roles
-- Fixes error: "permission denied for schema public" (PostgreSQL 42501)
-- -------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- -------------------------------------------------------------
-- STEP 2: Create Table: mental_health_assessments
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mental_health_assessments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  input_data jsonb NOT NULL,
  prediction text,
  status text DEFAULT 'processing'::text,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mental_health_assessments_pkey PRIMARY KEY (id),
  CONSTRAINT mental_health_assessments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS mental_health_assessments_user_id_idx
ON public.mental_health_assessments(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.mental_health_assessments ENABLE ROW LEVEL SECURITY;

-- Drop old conflicting policies
DROP POLICY IF EXISTS "Users can view their own assessments" ON public.mental_health_assessments;
DROP POLICY IF EXISTS "Users can insert their own assessments" ON public.mental_health_assessments;
DROP POLICY IF EXISTS "Users can update their own assessments" ON public.mental_health_assessments;
DROP POLICY IF EXISTS "Allow assessment insertion" ON public.mental_health_assessments;
DROP POLICY IF EXISTS "Allow assessment selection" ON public.mental_health_assessments;
DROP POLICY IF EXISTS "Allow assessment update" ON public.mental_health_assessments;

-- RLS Policies: Allow authenticated users and anon clients (guest & app sessions)
CREATE POLICY "Allow assessment insertion"
ON public.mental_health_assessments
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow assessment selection"
ON public.mental_health_assessments
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow assessment update"
ON public.mental_health_assessments
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- -------------------------------------------------------------
-- STEP 3: Create Table: assessment_questions
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assessment_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question_id integer NOT NULL UNIQUE,
  question_key text NOT NULL,
  time_key text NOT NULL,
  question_text text NOT NULL,
  clinical_term text,
  doctor_explanation text,
  doctor_tip text,
  listen_text text NOT NULL,
  options jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT assessment_questions_pkey PRIMARY KEY (id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;

-- Drop old conflicting policies
DROP POLICY IF EXISTS "Anyone can view assessment questions" ON public.assessment_questions;
DROP POLICY IF EXISTS "Service or authenticated can upsert questions" ON public.assessment_questions;
DROP POLICY IF EXISTS "Anyone can insert or update questions" ON public.assessment_questions;

-- RLS Policies for assessment_questions
CREATE POLICY "Anyone can view assessment questions"
ON public.assessment_questions
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can insert or update questions"
ON public.assessment_questions
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- -------------------------------------------------------------
-- STEP 4: Seed All 9 PHQ-9 Questions directly into assessment_questions
-- -------------------------------------------------------------
INSERT INTO public.assessment_questions (
  question_id, question_key, time_key, question_text,
  clinical_term, doctor_explanation, doctor_tip, listen_text, options, updated_at
) VALUES
(
  1,
  'question1',
  'time1',
  'Little interest or pleasure in doing things?',
  'Anhedonia (Loss of Interest or Pleasure)',
  'Loss of interest or pleasure in daily activities. Think about hobbies, daily routines, social interactions, or work that you typically enjoy.',
  'Notice whether you have to force yourself to do things you used to love.',
  'Question 1 of 9: Little interest or pleasure in doing things. Over the last two weeks, have your daily activities felt unrewarding?',
  '[{"value": 0, "label": "Not at all", "description": "0 days"}, {"value": 1, "label": "Several days", "description": "1-7 days"}, {"value": 2, "label": "More than half the days", "description": "7-11 days"}, {"value": 3, "label": "Nearly every day", "description": "12-14 days"}]'::jsonb,
  NOW()
),
(
  2,
  'question2',
  'time2',
  'Feeling down, depressed, or hopeless?',
  'Depressed Mood & Hopelessness',
  'Persistent feelings of sadness, emotional heaviness, or pessimism about tomorrow. It reflects core mood stability.',
  'Focus on how many days you experienced a lingering sense of discouragement.',
  'Question 2 of 9: Feeling down, depressed, or hopeless. Have you felt persistent heaviness or sadness about your future?',
  '[{"value": 0, "label": "Not at all", "description": "0 days"}, {"value": 1, "label": "Several days", "description": "1-7 days"}, {"value": 2, "label": "More than half the days", "description": "7-11 days"}, {"value": 3, "label": "Nearly every day", "description": "12-14 days"}]'::jsonb,
  NOW()
),
(
  3,
  'question3',
  'time3',
  'Trouble falling or staying asleep, or sleeping too much?',
  'Sleep Architecture Disturbance',
  'Disruptions in circadian rhythm and restorative sleep. Includes insomnia as well as sleeping excessively while feeling exhausted.',
  'Consider both nighttime insomnia and excessive daytime sleeping.',
  'Question 3 of 9: Trouble falling or staying asleep, or sleeping too much. How has your sleep quality been recently?',
  '[{"value": 0, "label": "Not at all", "description": "0 days"}, {"value": 1, "label": "Several days", "description": "1-7 days"}, {"value": 2, "label": "More than half the days", "description": "7-11 days"}, {"value": 3, "label": "Nearly every day", "description": "12-14 days"}]'::jsonb,
  NOW()
),
(
  4,
  'question4',
  'time4',
  'Feeling tired or having little energy?',
  'Fatigue & Energy Depletion (Anergia)',
  'A chronic reduction in physical and mental stamina, even without heavy physical labor. Small tasks feel exhausting.',
  'Reflect on your physical stamina from morning until evening.',
  'Question 4 of 9: Feeling tired or having little energy. Does your body or mind feel consistently drained, even after resting?',
  '[{"value": 0, "label": "Not at all", "description": "0 days"}, {"value": 1, "label": "Several days", "description": "1-7 days"}, {"value": 2, "label": "More than half the days", "description": "7-11 days"}, {"value": 3, "label": "Nearly every day", "description": "12-14 days"}]'::jsonb,
  NOW()
),
(
  5,
  'question5',
  'time5',
  'Poor appetite or overeating?',
  'Appetite & Metabolic Dysregulation',
  'Changes in nutritional regulation triggered by stress or neurochemical changes, such as loss of appetite or comfort eating.',
  'Notice any noticeable shifts in your relationship with food.',
  'Question 5 of 9: Poor appetite or overeating. Have you noticed significant changes in your appetite or eating habits?',
  '[{"value": 0, "label": "Not at all", "description": "0 days"}, {"value": 1, "label": "Several days", "description": "1-7 days"}, {"value": 2, "label": "More than half the days", "description": "7-11 days"}, {"value": 3, "label": "Nearly every day", "description": "12-14 days"}]'::jsonb,
  NOW()
),
(
  6,
  'question6',
  'time6',
  'Feeling bad about yourself — or that you are a failure or have let yourself or your family down?',
  'Negative Self-Cognition & Guilt',
  'Severe internal self-criticism, feelings of inadequacy, or excessive unwarranted guilt toward yourself or family.',
  'Are you being unusually harsh on yourself for everyday struggles?',
  'Question 6 of 9: Feeling bad about yourself, or that you are a failure. Have you struggled with negative self-criticism or guilt?',
  '[{"value": 0, "label": "Not at all", "description": "0 days"}, {"value": 1, "label": "Several days", "description": "1-7 days"}, {"value": 2, "label": "More than half the days", "description": "7-11 days"}, {"value": 3, "label": "Nearly every day", "description": "12-14 days"}]'::jsonb,
  NOW()
),
(
  7,
  'question7',
  'time7',
  'Trouble concentrating on things, such as reading the newspaper or watching television?',
  'Cognitive Focus & Executive Function',
  'Mental fog and difficulty concentrating on cognitive tasks—such as reading, work meetings, or conversations.',
  'Think about your productivity and attention span at school, work, or home.',
  'Question 7 of 9: Trouble concentrating on things. Has mental fog made it hard to focus on work, reading, or conversations?',
  '[{"value": 0, "label": "Not at all", "description": "0 days"}, {"value": 1, "label": "Several days", "description": "1-7 days"}, {"value": 2, "label": "More than half the days", "description": "7-11 days"}, {"value": 3, "label": "Nearly every day", "description": "12-14 days"}]'::jsonb,
  NOW()
),
(
  8,
  'question8',
  'time8',
  'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual?',
  'Psychomotor Agitation or Retardation',
  'Physical manifestations of emotional state. Slowed speech and movement, or restlessness and inability to sit still.',
  'Would family or colleagues have noticed you moving noticeably slower or restlessly?',
  'Question 8 of 9: Moving or speaking noticeably slower than usual, or feeling unusually fidgety and restless?',
  '[{"value": 0, "label": "Not at all", "description": "0 days"}, {"value": 1, "label": "Several days", "description": "1-7 days"}, {"value": 2, "label": "More than half the days", "description": "7-11 days"}, {"value": 3, "label": "Nearly every day", "description": "12-14 days"}]'::jsonb,
  NOW()
),
(
  9,
  'question9',
  'time9',
  'Thoughts that you would be better off dead or of hurting yourself in some way?',
  'Safety & Self-Harm Ideation',
  'A critical clinical safety question evaluating passive wishes or thoughts of self-harm. MindHealth AI treats safety as the utmost priority.',
  'Answer honestly—confidential help and emergency support resources are always provided.',
  'Question 9 of 9: Thoughts that you would be better off dead or of hurting yourself. Please answer safely and honestly.',
  '[{"value": 0, "label": "Not at all", "description": "0 days"}, {"value": 1, "label": "Several days", "description": "1-7 days"}, {"value": 2, "label": "More than half the days", "description": "7-11 days"}, {"value": 3, "label": "Nearly every day", "description": "12-14 days"}]'::jsonb,
  NOW()
)
ON CONFLICT (question_id) DO UPDATE SET
  question_key = EXCLUDED.question_key,
  time_key = EXCLUDED.time_key,
  question_text = EXCLUDED.question_text,
  clinical_term = EXCLUDED.clinical_term,
  doctor_explanation = EXCLUDED.doctor_explanation,
  doctor_tip = EXCLUDED.doctor_tip,
  listen_text = EXCLUDED.listen_text,
  options = EXCLUDED.options,
  updated_at = NOW();

-- -------------------------------------------------------------
-- Re-apply grants to newly created objects
-- -------------------------------------------------------------
GRANT ALL ON TABLE public.mental_health_assessments TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.assessment_questions TO anon, authenticated, service_role;
