import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Report {
  id: string;
  title: string;
  description?: string;
  reportType: 'customer_analysis' | 'payment_analysis' | 'credit_analysis' | 'custom';
  filters?: any;
  data?: any;
  createdAt?: string;
  updatedAt?: string;
}

interface DatabaseReport {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  report_type: string;
  filters: any;
  data: any;
  created_at: string;
  updated_at: string;
}

// تحويل من نموذج قاعدة البيانات إلى نموذج التطبيق
const transformFromDatabase = (dbReport: DatabaseReport): Report => ({
  id: dbReport.id,
  title: dbReport.title,
  description: dbReport.description || '',
  reportType: dbReport.report_type as Report['reportType'],
  filters: dbReport.filters,
  data: dbReport.data,
  createdAt: dbReport.created_at,
  updatedAt: dbReport.updated_at,
});

// تحويل من نموذج التطبيق إلى نموذج قاعدة البيانات
const transformToDatabase = (report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>) => ({
  title: report.title,
  description: report.description || null,
  report_type: report.reportType,
  filters: report.filters || null,
  data: report.data || null,
});

export const useReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // جلب التقارير من قاعدة البيانات
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        setReports([]);
        return;
      }

      const { data, error: fetchError } = await (supabase as any)
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const transformedReports = (data || []).map((item: any) => transformFromDatabase(item));
      setReports(transformedReports);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ في جلب التقارير';
      setError(errorMessage);
      toast({
        title: "خطأ في جلب التقارير",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // إضافة تقرير جديد
  const addReport = async (reportData: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      const dbReport = {
        ...transformToDatabase(reportData),
        user_id: session.session.user.id,
      };

      const { data, error } = await (supabase as any)
        .from('reports')
        .insert([dbReport])
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newReport = transformFromDatabase(data as any);
      setReports(prev => [newReport, ...prev]);
      
      toast({
        title: "تم إنشاء التقرير بنجاح",
        description: `تم إنشاء تقرير "${newReport.title}"`,
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ في إنشاء التقرير';
      toast({
        title: "خطأ في إنشاء التقرير",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  // تحديث تقرير
  const updateReport = async (id: string, reportData: Partial<Omit<Report, 'id' | 'createdAt' | 'updatedAt'>>): Promise<boolean> => {
    try {
      const dbUpdate = transformToDatabase(reportData as any);
      
      const { data, error } = await (supabase as any)
        .from('reports')
        .update(dbUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const updatedReport = transformFromDatabase(data as any);
      setReports(prev => prev.map(report => 
        report.id === id ? updatedReport : report
      ));
      
      toast({
        title: "تم تحديث التقرير بنجاح",
        description: `تم تحديث تقرير "${updatedReport.title}"`,
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ في تحديث التقرير';
      toast({
        title: "خطأ في تحديث التقرير",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  // حذف تقرير
  const deleteReport = async (id: string): Promise<boolean> => {
    try {
      const { error } = await (supabase as any)
        .from('reports')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setReports(prev => prev.filter(report => report.id !== id));
      
      toast({
        title: "تم حذف التقرير بنجاح",
        description: "تم حذف التقرير من قاعدة البيانات",
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ في حذف التقرير';
      toast({
        title: "خطأ في حذف التقرير",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  // إنشاء تقرير تحليل العملاء
  const generateCustomerAnalysisReport = async (customers: any[]): Promise<boolean> => {
    const reportData = {
      title: `تقرير تحليل العملاء - ${new Date().toLocaleDateString('ar-EG')}`,
      description: 'تحليل شامل لسلوك العملاء والدرجات الائتمانية',
      reportType: 'customer_analysis' as const,
      data: {
        totalCustomers: customers.length,
        averageCreditScore: customers.reduce((sum, c) => sum + c.creditScore, 0) / customers.length,
        statusDistribution: {
          excellent: customers.filter(c => c.status === 'excellent').length,
          good: customers.filter(c => c.status === 'good').length,
          fair: customers.filter(c => c.status === 'fair').length,
          poor: customers.filter(c => c.status === 'poor').length,
        },
        averagePaymentCommitment: customers.reduce((sum, c) => sum + c.paymentCommitment, 0) / customers.length,
        totalDebt: customers.reduce((sum, c) => sum + c.totalDebt, 0),
        generatedAt: new Date().toISOString(),
      }
    };

    return await addReport(reportData);
  };

  // إنشاء تقرير تحليل الدفع
  const generatePaymentAnalysisReport = async (paymentRecords: any[]): Promise<boolean> => {
    const reportData = {
      title: `تقرير تحليل الدفع - ${new Date().toLocaleDateString('ar-EG')}`,
      description: 'تحليل أنماط الدفع والالتزام',
      reportType: 'payment_analysis' as const,
      data: {
        totalPayments: paymentRecords.length,
        paidOnTime: paymentRecords.filter(p => p.status === 'paid' && p.daysLate === 0).length,
        latePayments: paymentRecords.filter(p => p.status === 'late').length,
        missedPayments: paymentRecords.filter(p => p.status === 'missed').length,
        averageDaysLate: paymentRecords
          .filter(p => p.daysLate > 0)
          .reduce((sum, p) => sum + p.daysLate, 0) / 
          paymentRecords.filter(p => p.daysLate > 0).length || 0,
        totalAmount: paymentRecords.reduce((sum, p) => sum + p.amount, 0),
        generatedAt: new Date().toISOString(),
      }
    };

    return await addReport(reportData);
  };

  // جلب البيانات عند تحميل الكومبوننت
  useEffect(() => {
    fetchReports();
  }, []);

  // الاستماع لتغييرات حالة المصادقة
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setReports([]);
      } else if (event === 'SIGNED_IN' && session) {
        fetchReports();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    reports,
    loading,
    error,
    addReport,
    updateReport,
    deleteReport,
    generateCustomerAnalysisReport,
    generatePaymentAnalysisReport,
    refetch: fetchReports,
  };
};