/*
  # إضافة حقل مبلغ القسط

  1. تعديلات الجدول
    - إضافة حقل `installment_amount` إلى جدول `customers`
    - إضافة دالة لتوليد كود العميل التلقائي
    - إضافة trigger لتوليد كود العميل عند الإدراج

  2. الأمان
    - لا توجد تغييرات على RLS
*/

-- إضافة حقل مبلغ القسط
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'installment_amount'
  ) THEN
    ALTER TABLE customers ADD COLUMN installment_amount DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;

-- دالة لتوليد كود العميل التلقائي
CREATE OR REPLACE FUNCTION generate_customer_code()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql;

-- دالة trigger لتوليد كود العميل
CREATE OR REPLACE FUNCTION set_customer_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.customer_code IS NULL OR NEW.customer_code = '' THEN
        NEW.customer_code := generate_customer_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger
DROP TRIGGER IF EXISTS trigger_set_customer_code ON customers;
CREATE TRIGGER trigger_set_customer_code
    BEFORE INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION set_customer_code();