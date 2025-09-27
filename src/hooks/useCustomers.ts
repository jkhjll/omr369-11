import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  status: 'excellent' | 'good' | 'fair' | 'poor';
  createdAt?: string;
  updatedAt?: string;
}

export interface DatabaseCustomer {
  id: string;
  user_id: string;
  customer_code: string;
  name: string;
  phone: string;
  credit_score: number;
  payment_commitment: number;
  haggling_level: number;
  purchase_willingness: number;
  last_payment: string | null;
  total_debt: number;
  status: string;
  created_at: string;
  updated_at: string;
}

// تحويل من نموذج قاعدة البيانات إلى نموذج التطبيق
const transformFromDatabase = (dbCustomer: DatabaseCustomer): CustomerData => ({
  id: dbCustomer.id,
  customerCode: dbCustomer.customer_code,
  name: dbCustomer.name,
  phone: dbCustomer.phone,
  creditScore: dbCustomer.credit_score,
  paymentCommitment: dbCustomer.payment_commitment,
  hagglingLevel: dbCustomer.haggling_level,
  purchaseWillingness: dbCustomer.purchase_willingness,
  lastPayment: dbCustomer.last_payment || '',
  totalDebt: Number(dbCustomer.total_debt),
  status: dbCustomer.status as CustomerData['status'],
  createdAt: dbCustomer.created_at,
  updatedAt: dbCustomer.updated_at,
});

// تحويل من نموذج التطبيق إلى نموذج قاعدة البيانات
const transformToDatabase = (customer: Omit<CustomerData, 'id' | 'createdAt' | 'updatedAt'>) => ({
  customer_code: customer.customerCode,
  name: customer.name,
  phone: customer.phone,
  credit_score: customer.creditScore,
  payment_commitment: customer.paymentCommitment,
  haggling_level: customer.hagglingLevel,
  purchase_willingness: customer.purchaseWillingness,
  last_payment: customer.lastPayment || null,
  total_debt: customer.totalDebt,
  status: customer.status,
});

export const useCustomers = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // جلب العملاء من قاعدة البيانات
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        setCustomers([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const transformedCustomers = (data || []).map(transformFromDatabase);
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
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      const dbCustomer = {
        ...transformToDatabase(customerData),
        user_id: session.session.user.id,
      };

      const { data, error } = await supabase
        .from('customers')
        .insert([dbCustomer])
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newCustomer = transformFromDatabase(data);
      setCustomers(prev => [newCustomer, ...prev]);
      
      toast({
        title: "تم إضافة العميل بنجاح",
        description: `تم إضافة ${newCustomer.name} إلى قاعدة البيانات`,
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ في إضافة العميل';
      toast({
        title: "خطأ في إضافة العميل",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  // إضافة عملاء متعددين (للاستيراد)
  const addMultipleCustomers = async (customersData: Omit<CustomerData, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<boolean> => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      const dbCustomers = customersData.map(customer => ({
        ...transformToDatabase(customer),
        user_id: session.session.user.id,
      }));

      const { data, error } = await supabase
        .from('customers')
        .insert(dbCustomers)
        .select();

      if (error) {
        throw error;
      }

      const newCustomers = (data || []).map(transformFromDatabase);
      setCustomers(prev => [...newCustomers, ...prev]);
      
      toast({
        title: "تم استيراد البيانات بنجاح",
        description: `تم إضافة ${newCustomers.length} عميل إلى قاعدة البيانات`,
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ في استيراد البيانات';
      toast({
        title: "خطأ في استيراد البيانات",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  // تحديث عميل
  const updateCustomer = async (id: string, customerData: Partial<Omit<CustomerData, 'id' | 'createdAt' | 'updatedAt'>>): Promise<boolean> => {
    try {
      const dbUpdate = transformToDatabase(customerData as any);
      
      const { data, error } = await supabase
        .from('customers')
        .update(dbUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const updatedCustomer = transformFromDatabase(data);
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
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

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
      } else if (event === 'SIGNED_IN' && session) {
        fetchCustomers();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    customers,
    loading,
    error,
    addCustomer,
    addMultipleCustomers,
    updateCustomer,
    deleteCustomer,
    refetch: fetchCustomers,
  };
};