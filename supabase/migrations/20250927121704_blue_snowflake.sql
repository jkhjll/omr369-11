@@ .. @@
-- تمكين Row Level Security
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
+GRANT SELECT ON public.payment_records TO anon;
+GRANT INSERT ON public.payment_records TO anon;
+GRANT UPDATE ON public.payment_records TO anon;
+GRANT DELETE ON public.payment_records TO anon;
+
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
+GRANT SELECT ON public.reports TO anon;
+GRANT INSERT ON public.reports TO anon;
+GRANT UPDATE ON public.reports TO anon;
+GRANT DELETE ON public.reports TO anon;
+
ALTER TABLE public.report_data ENABLE ROW LEVEL SECURITY;
+GRANT SELECT ON public.report_data TO anon;
+GRANT INSERT ON public.report_data TO anon;
+GRANT UPDATE ON public.report_data TO anon;
+GRANT DELETE ON public.report_data TO anon;