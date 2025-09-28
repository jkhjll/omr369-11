/*
  # إنشاء جدول سجلات الدفع وجدول التقارير

  1. جداول جديدة
    - `payment_records` - سجلات الدفعات للعملاء
    - `reports` - التقارير المحفوظة
    - `report_data` - بيانات التقارير التفصيلية

  2. الأمان
    - تمكين RLS على جميع الجداول
    - إضافة سياسات للمستخدمين المصرح لهم

  3. الفهارس
    - فهارس لتحسين الأداء
*/

-- إنشاء جدول سجلات الدفع
CREATE TABLE IF NOT EXISTS public.payment_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL CHECK (status IN ('paid', 'late', 'pending', 'missed')) DEFAULT 'pending',
  days_late INTEGER DEFAULT 0 CHECK (days_late >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول التقارير
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN ('customer_analysis', 'payment_analysis', 'credit_analysis', 'custom')),
  filters JSONB,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول بيانات التقارير التفصيلية
CREATE TABLE IF NOT EXISTS public.report_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL,
  data_type TEXT NOT NULL,
  data_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة المفاتيح الخارجية
ALTER TABLE public.payment_records 
ADD CONSTRAINT fk_payment_records_customer 
FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

ALTER TABLE public.report_data 
ADD CONSTRAINT fk_report_data_report 
FOREIGN KEY (report_id) REFERENCES public.reports(id) ON DELETE CASCADE;

-- تمكين Row Level Security
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_data ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لسجلات الدفع
CREATE POLICY "Users can view their own payment records" 
ON public.payment_records 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment records" 
ON public.payment_records 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment records" 
ON public.payment_records 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment records" 
ON public.payment_records 
FOR DELETE 
USING (auth.uid() = user_id);

-- سياسات الأمان للتقارير
CREATE POLICY "Users can view their own reports" 
ON public.reports 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reports" 
ON public.reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" 
ON public.reports 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports" 
ON public.reports 
FOR DELETE 
USING (auth.uid() = user_id);

-- سياسات الأمان لبيانات التقارير
CREATE POLICY "Users can view their own report data" 
ON public.report_data 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.reports 
  WHERE reports.id = report_data.report_id 
  AND reports.user_id = auth.uid()
));

CREATE POLICY "Users can create their own report data" 
ON public.report_data 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.reports 
  WHERE reports.id = report_data.report_id 
  AND reports.user_id = auth.uid()
));

CREATE POLICY "Users can update their own report data" 
ON public.report_data 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.reports 
  WHERE reports.id = report_data.report_id 
  AND reports.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own report data" 
ON public.report_data 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.reports 
  WHERE reports.id = report_data.report_id 
  AND reports.user_id = auth.uid()
));

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_payment_records_user_id ON public.payment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_customer_id ON public.payment_records(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_status ON public.payment_records(status);
CREATE INDEX IF NOT EXISTS idx_payment_records_due_date ON public.payment_records(due_date);
CREATE INDEX IF NOT EXISTS idx_payment_records_paid_date ON public.payment_records(paid_date);

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON public.reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at);

CREATE INDEX IF NOT EXISTS idx_report_data_report_id ON public.report_data(report_id);
CREATE INDEX IF NOT EXISTS idx_report_data_type ON public.report_data(data_type);

-- إنشاء triggers لتحديث updated_at
CREATE TRIGGER update_payment_records_updated_at
BEFORE UPDATE ON public.payment_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- دالة لحساب أيام التأخير تلقائياً
CREATE OR REPLACE FUNCTION public.calculate_days_late()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.paid_date IS NOT NULL AND NEW.due_date IS NOT NULL THEN
        NEW.days_late = GREATEST(0, NEW.paid_date - NEW.due_date);
        
        -- تحديث الحالة بناءً على التأخير
        IF NEW.days_late = 0 THEN
            NEW.status = 'paid';
        ELSIF NEW.days_late > 0 THEN
            NEW.status = 'late';
        END IF;
    ELSIF NEW.due_date < CURRENT_DATE AND NEW.paid_date IS NULL THEN
        NEW.status = 'missed';
        NEW.days_late = CURRENT_DATE - NEW.due_date;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- إنشاء trigger لحساب أيام التأخير
CREATE TRIGGER calculate_payment_days_late
BEFORE INSERT OR UPDATE ON public.payment_records
FOR EACH ROW
EXECUTE FUNCTION public.calculate_days_late();