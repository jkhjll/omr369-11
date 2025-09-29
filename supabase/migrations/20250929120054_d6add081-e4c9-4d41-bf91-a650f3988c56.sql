-- Fix security warnings by adding search_path to functions
CREATE OR REPLACE FUNCTION public.generate_customer_code()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
    next_number INTEGER;
BEGIN
    -- الحصول على أعلى رقم موجود
    SELECT COALESCE(
        MAX(
            CASE 
                WHEN customer_code ~ '^C-[0-9]+$' 
                THEN CAST(SUBSTRING(customer_code FROM 3) AS INTEGER)
                ELSE 0
            END
        ), 0
    ) + 1 INTO next_number
    FROM customers;
    
    RETURN 'C-' || next_number::TEXT;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_customer_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
    IF NEW.customer_code IS NULL OR NEW.customer_code = '' THEN
        NEW.customer_code := generate_customer_code();
    END IF;
    RETURN NEW;
END;
$function$;