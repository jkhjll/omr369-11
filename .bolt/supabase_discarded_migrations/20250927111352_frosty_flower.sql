/*
  # إضافة حقل كود العميل

  1. تعديل الجدول
    - إضافة عمود `customer_code` إلى جدول `customers`
    - إضافة قيد فريد على `customer_code` لكل مستخدم
    - إضافة فهرس لتحسين الأداء

  2. تحديث البيانات الموجودة
    - إنشاء أكواد تلقائية للعملاء الموجودين
*/

-- إضافة عمود كود العميل
ALTER TABLE public.customers 
ADD COLUMN customer_code TEXT;

-- تحديث البيانات الموجودة بأكواد تلقائية
UPDATE public.customers 
SET customer_code = 'C' || LPAD(ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at)::TEXT, 3, '0')
WHERE customer_code IS NULL;

-- جعل العمود مطلوب
ALTER TABLE public.customers 
ALTER COLUMN customer_code SET NOT NULL;

-- إضافة قيد فريد على كود العميل لكل مستخدم
ALTER TABLE public.customers 
ADD CONSTRAINT unique_customer_code_per_user UNIQUE (user_id, customer_code);

-- إضافة فهرس لتحسين الأداء
CREATE INDEX idx_customers_customer_code ON public.customers(customer_code);