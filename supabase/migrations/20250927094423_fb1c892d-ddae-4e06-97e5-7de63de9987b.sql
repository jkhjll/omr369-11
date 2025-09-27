-- Create credit_calculations table
CREATE TABLE public.credit_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID,
  monthly_income NUMERIC NOT NULL,
  current_debt NUMERIC NOT NULL DEFAULT 0,
  credit_score INTEGER NOT NULL,
  payment_history INTEGER NOT NULL,
  years_with_store NUMERIC NOT NULL DEFAULT 0,
  calculated_credit_limit NUMERIC NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  calculation_factors JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key to customers table
ALTER TABLE public.credit_calculations 
ADD CONSTRAINT fk_credit_calculations_customer 
FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;

-- Enable Row Level Security
ALTER TABLE public.credit_calculations ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own credit calculations" 
ON public.credit_calculations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own credit calculations" 
ON public.credit_calculations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credit calculations" 
ON public.credit_calculations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credit calculations" 
ON public.credit_calculations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_credit_calculations_updated_at
BEFORE UPDATE ON public.credit_calculations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();