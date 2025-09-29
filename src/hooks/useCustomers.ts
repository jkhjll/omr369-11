import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';

export interface CustomerData {
  id: string;
  customerCode: string;
  name: string;
  phone: string;
  creditScore: number;
  paymentCommitment: number;
  hagglingLevel: number;
  purchaseWillingness: number;
  lastPayment: string;
  totalDebt: number;
  installmentAmount: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  createdAt?: string;
  updatedAt?: string;
}

export interface DatabaseCustomer {
  id: string;
  user_id: string;
  customer_code?: string;
  name: string;
  phone: string;
  credit_score: number;
  payment_commitment: number;
  haggling_level: number;
  purchase_willingness: number;
  last_payment: string | null;
  total_debt: number;
  installment_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

// تحويل من نموذج قاعدة البيانات إلى نموذج التطبيق
const transformFromDatabase = (dbCustomer: any): CustomerData => ({
  id: dbCustomer.id,
  customerCode: dbCustomer.customer_code || `CU${Date.now()}`,
  name: dbCustomer.name,
  phone: dbCustomer.phone,
  creditScore: dbCustomer.credit_score,
  paymentCommitment: dbCustomer.payment_commitment,
  hagglingLevel: dbCustomer.negotiation_level || dbCustomer.haggling_level,
  purchaseWillingness: dbCustomer.willingness_to_buy || dbCustomer.purchase_willingness,
  lastPayment: dbCustomer.last_payment_date || dbCustomer.last_payment || '',
  totalDebt: Number(dbCustomer.total_debt) || 0,
  installmentAmount: Number(dbCustomer.installment_amount) || 0,
  status: dbCustomer.status as CustomerData['status'],
  createdAt: dbCustomer.created_at,
  updatedAt: dbCustomer.updated_at,
});

// تحويل من نموذج التطبيق إلى نموذج قاعدة البيانات
const transformToDatabase = (customer: Omit<CustomerData, 'id' | 'createdAt' | 'updatedAt'>) => {
  return {
    name: customer.name,
    phone: customer.phone,
    credit_score: customer.creditScore,
    payment_commitment: customer.paymentCommitment,
    negotiation_level: customer.hagglingLevel,
    willingness_to_buy: customer.purchaseWillingness,
    last_payment_date: customer.lastPayment || null,
    total_debt: customer.totalDebt,
    installment_amount: customer.installmentAmount,
    status: customer.status,
  };
};

export const useCustomers = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  // جلب العملاء من قاعدة البيانات
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      // التحقق من حالة المصادقة
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(`خطأ في جلسة المصادقة: ${sessionError.message}`);
      }
      
      if (!session?.user) {
        setCustomers([]);
        setUser(null);
        return;
      }

      setUser(session.user);

      const { data, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const transformedCustomers = (data || []).map((item: any) => transformFromDatabase(item));
      setCustomers(transformedCustomers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ في جلب البيانات';
      setError(errorMessage);
      toast({
        title: "خطأ في جلب البيانات",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // إضافة عميل جديد
  const addCustomer = async (customerData: Omit<CustomerData, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(`خطأ في جلسة المصادقة: ${sessionError.message}`);
      }
      
      if (!session?.user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      const insertPayload = {
        user_id: session.user.id,
        name: customerData.name,
        phone: customerData.phone,
        credit_score: customerData.creditScore,
        payment_commitment: customerData.paymentCommitment,
        negotiation_level: customerData.hagglingLevel,
        willingness_to_buy: customerData.purchaseWillingness,
        last_payment_date: customerData.lastPayment || null,
        total_debt: customerData.totalDebt,
        installment_amount: customerData.installmentAmount,
        status: customerData.status,
      };

      const { data, error } = await supabase
        .from('customers')
        .insert([insertPayload])
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      const newCustomer = transformFromDatabase(data as any);
      setCustomers(prev => [newCustomer, ...prev]);
      
      toast({
        title: "تم إضافة العميل بنجاح",
        description: `تم إضافة ${newCustomer.name} إلى قاعدة البيانات`,
      });

      return true;
    } catch (err) {
      console.error("Supabase addCustomer error:", err); // تسجيل الخطأ الكامل في الكونسول
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير معروف أثناء إضافة العميل';
      toast({
        title: "خطأ في إضافة العميل",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  // تحديث عميل
  const updateCustomer = async (id: string, customerData: Partial<Omit<CustomerData, 'id' | 'createdAt' | 'updatedAt'>>): Promise<boolean> => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(`خطأ في جلسة المصادقة: ${sessionError.message}`);
      }
      
      if (!session?.user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      const dbUpdate = transformToDatabase(customerData as any);
      
      const { data, error } = await supabase
        .from('customers')
        .update(dbUpdate)
        .eq('id', id)
        .eq('user_id', session.user.id)
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      const updatedCustomer = transformFromDatabase(data as any);
      setCustomers(prev => prev.map(customer => 
        customer.id === id ? updatedCustomer : customer
      ));
      
      toast({
        title: "تم تحديث العميل بنجاح",
        description: `تم تحديث بيانات ${updatedCustomer.name}`,
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ في تحديث العميل';
      toast({
        title: "خطأ في تحديث العميل",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  // حذف عميل
  const deleteCustomer = async (id: string): Promise<boolean> => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(`خطأ في جلسة المصادقة: ${sessionError.message}`);
      }
      
      if (!session?.user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        throw error;
      }

      setCustomers(prev => prev.filter(customer => customer.id !== id));
      
      toast({
        title: "تم حذف العميل بنجاح",
        description: "تم حذف العميل من قاعدة البيانات",
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ في حذف العميل';
      toast({
        title: "خطأ في حذف العميل",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  // جلب البيانات عند تحميل الكومبوننت
  useEffect(() => {
    fetchCustomers();
  }, []);

  // الاستماع لتغييرات حالة المصادقة
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setCustomers([]);
        setUser(null);
      } else if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
        fetchCustomers();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    customers,
    loading,
    error,
    user,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    refetch: fetchCustomers,
  };
};