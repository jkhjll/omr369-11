import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';

export interface PaymentRecord {
  id: string;
  customerId: string;
  dueDate: string;
  paidDate: string | null;
  amount: number;
  status: 'paid' | 'late' | 'pending' | 'missed';
  daysLate?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface DatabasePaymentRecord {
  id: string;
  user_id: string;
  customer_id: string;
  due_date: string;
  paid_date: string | null;
  amount: number;
  status: string;
  days_late: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// تحويل من نموذج قاعدة البيانات إلى نموذج التطبيق
const transformFromDatabase = (dbRecord: any): PaymentRecord => ({
  id: dbRecord.id,
  customerId: dbRecord.customer_id,
  dueDate: dbRecord.due_date,
  paidDate: dbRecord.paid_date,
  amount: Number(dbRecord.amount),
  status: dbRecord.status as PaymentRecord['status'],
  daysLate: dbRecord.days_late || 0,
  notes: dbRecord.notes || '',
  createdAt: dbRecord.created_at,
  updatedAt: dbRecord.updated_at,
});

// تحويل من نموذج التطبيق إلى نموذج قاعدة البيانات
const transformToDatabase = (record: Omit<PaymentRecord, 'id' | 'createdAt' | 'updatedAt'>) => ({
  customer_id: record.customerId,
  due_date: record.dueDate,
  paid_date: record.paidDate,
  amount: record.amount,
  status: record.status,
  days_late: record.daysLate || 0,
  notes: record.notes || null,
});

export const usePaymentRecords = (customerId?: string) => {
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  // جلب سجلات الدفع من قاعدة البيانات
  const fetchPaymentRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(`خطأ في جلسة المصادقة: ${sessionError.message}`);
      }
      
      if (!session?.user) {
        setPaymentRecords([]);
        setUser(null);
        return;
      }

      setUser(session.user);

      let query = supabase
        .from('payment_records')
        .select('*')
        .eq('user_id', session.user.id)
        .order('due_date', { ascending: false });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      const transformedRecords = (data || []).map((item: any) => transformFromDatabase(item));
      setPaymentRecords(transformedRecords);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ في جلب سجلات الدفع';
      setError(errorMessage);
      toast({
        title: "خطأ في جلب سجلات الدفع",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // إضافة سجل دفع جديد
  const addPaymentRecord = async (recordData: Omit<PaymentRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(`خطأ في جلسة المصادقة: ${sessionError.message}`);
      }
      
      if (!session?.user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      const dbRecord = {
        ...transformToDatabase(recordData),
        user_id: session.user.id,
      };

      const { data, error } = await supabase
        .from('payment_records')
        .insert([dbRecord])
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newRecord = transformFromDatabase(data as any);
      setPaymentRecords(prev => [newRecord, ...prev]);
      
      toast({
        title: "تم إضافة سجل الدفع بنجاح",
        description: `تم إضافة سجل دفع بمبلغ ${newRecord.amount} ج.م`,
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ في إضافة سجل الدفع';
      toast({
        title: "خطأ في إضافة سجل الدفع",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  // تحديث سجل دفع
  const updatePaymentRecord = async (id: string, recordData: Partial<Omit<PaymentRecord, 'id' | 'createdAt' | 'updatedAt'>>): Promise<boolean> => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(`خطأ في جلسة المصادقة: ${sessionError.message}`);
      }
      
      if (!session?.user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      const dbUpdate = transformToDatabase(recordData as any);
      
      const { data, error } = await supabase
        .from('payment_records')
        .update(dbUpdate)
        .eq('id', id)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const updatedRecord = transformFromDatabase(data as any);
      setPaymentRecords(prev => prev.map(record => 
        record.id === id ? updatedRecord : record
      ));
      
      toast({
        title: "تم تحديث سجل الدفع بنجاح",
        description: "تم تحديث بيانات سجل الدفع",
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ في تحديث سجل الدفع';
      toast({
        title: "خطأ في تحديث سجل الدفع",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  // حذف سجل دفع
  const deletePaymentRecord = async (id: string): Promise<boolean> => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(`خطأ في جلسة المصادقة: ${sessionError.message}`);
      }
      
      if (!session?.user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      const { error } = await supabase
        .from('payment_records')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        throw error;
      }

      setPaymentRecords(prev => prev.filter(record => record.id !== id));
      
      toast({
        title: "تم حذف سجل الدفع بنجاح",
        description: "تم حذف سجل الدفع من قاعدة البيانات",
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ في حذف سجل الدفع';
      toast({
        title: "خطأ في حذف سجل الدفع",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  // جلب البيانات عند تحميل الكومبوننت
  useEffect(() => {
    fetchPaymentRecords();
  }, [customerId]);

  // الاستماع لتغييرات حالة المصادقة
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setPaymentRecords([]);
        setUser(null);
      } else if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
        fetchPaymentRecords();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    paymentRecords,
    loading,
    error,
    user,
    addPaymentRecord,
    updatePaymentRecord,
    deletePaymentRecord,
    refetch: fetchPaymentRecords,
  };
};