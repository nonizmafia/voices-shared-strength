CREATE TABLE public.patient_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name text,
  draft text NOT NULL,
  title text NOT NULL,
  story text NOT NULL,
  quote text,
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.patient_stories TO service_role;
ALTER TABLE public.patient_stories ENABLE ROW LEVEL SECURITY;