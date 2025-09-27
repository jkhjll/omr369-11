@@ .. @@
-- Enable Row Level Security
ALTER TABLE public.credit_calculations ENABLE ROW LEVEL SECURITY;
+
+-- Grant permissions to anon role
+GRANT SELECT ON public.credit_calculations TO anon;
+GRANT INSERT ON public.credit_calculations TO anon;
+GRANT UPDATE ON public.credit_calculations TO anon;
+GRANT DELETE ON public.credit_calculations TO anon;