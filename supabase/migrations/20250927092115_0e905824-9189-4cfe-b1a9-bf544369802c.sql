-- إنشاء جدول العملاء
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  credit_score INTEGER NOT NULL CHECK (credit_score >= 300 AND credit_score <= 850),
  payment_commitment INTEGER NOT NULL CHECK (payment_commitment >= 0 AND payment_commitment <= 100),
  haggling_level INTEGER NOT NULL CHECK (haggling_level >= 1 AND haggling_level <= 10),
  purchase_willingness INTEGER NOT NULL CHECK (purchase_willingness >= 1 AND purchase_willingness <= 10),
  last_payment DATE,
  total_debt DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_debt >= 0),
  status TEXT NOT NULL CHECK (status IN ('excellent', 'good', 'fair', 'poor')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تمكين Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان - المستخدمون يمكنهم رؤية عملائهم فقط
CREATE POLICY "Users can view their own customers" 
ON public.customers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own customers" 
ON public.customers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customers" 
ON public.customers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customers" 
ON public.customers 
FOR DELETE 
USING (auth.uid() = user_id);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX idx_customers_user_id ON public.customers(user_id);
CREATE INDEX idx_customers_status ON public.customers(status);
CREATE INDEX idx_customers_credit_score ON public.customers(credit_score);
CREATE INDEX idx_customers_name ON public.customers(name);
CREATE INDEX idx_customers_phone ON public.customers(phone);

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- إنشاء trigger لتحديث updated_at
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();