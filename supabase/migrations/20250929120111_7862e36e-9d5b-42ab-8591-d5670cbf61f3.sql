-- Enable RLS and add policies for report_data table
ALTER TABLE public.report_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for report_data
CREATE POLICY "Users can view their own report data"
ON public.report_data
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own report data"
ON public.report_data
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own report data"
ON public.report_data
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own report data"
ON public.report_data
FOR DELETE
USING (auth.uid() = user_id);