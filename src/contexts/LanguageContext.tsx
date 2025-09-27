import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// الترجمات
const translations = {
  ar: {
    // Header
    'system.title': 'نظام تحليل سلوك العملاء',
    'system.subtitle': 'تحليل متطور لسلوك العملاء والائتمان',
    'system.lastUpdate': 'آخر تحديث',
    
    // Navigation
    'nav.customers': 'العملاء',
    'nav.creditCalculator': 'حاسبة الائتمان',
    'nav.paymentAnalysis': 'تحليل الدفع',
    'nav.reports': 'التقارير',
    
    // Buttons
    'btn.addCustomer': 'إضافة عميل',
    'btn.importData': 'استيراد البيانات',
    'btn.exportData': 'تصدير البيانات',
    'btn.viewDetails': 'عرض التفاصيل',
    'btn.save': 'حفظ',
    'btn.cancel': 'إلغاء',
    'btn.delete': 'حذف',
    'btn.edit': 'تعديل',
    'btn.close': 'إغلاق',
    
    // Search and filters
    'search.placeholder': 'البحث بالكود أو الاسم أو رقم الهاتف...',
    'filter.all': 'الكل',
    
    // Customer status
    'status.excellent': 'ممتاز',
    'status.good': 'جيد',
    'status.fair': 'مقبول',
    'status.poor': 'ضعيف',
    
    // Messages
    'msg.noCustomers': 'لا توجد بيانات عملاء',
    'msg.noSearchResults': 'لا توجد نتائج للبحث',
    'msg.loading': 'جاري التحميل...',
    'msg.error': 'حدث خطأ',
    
    // Customer fields
    'field.customerCode': 'كود العميل',
    'field.name': 'الاسم',
    'field.phone': 'رقم الهاتف',
    'field.creditScore': 'الدرجة الائتمانية',
    'field.paymentCommitment': 'التزام الدفع',
    'field.hagglingLevel': 'مستوى المساومة',
    'field.purchaseWillingness': 'الرغبة في الشراء',
    'field.lastPayment': 'آخر دفعة',
    'field.totalDebt': 'إجمالي الدين',
    'field.status': 'الحالة',
  },
  en: {
    // Header
    'system.title': 'Customer Behavior Analytics System',
    'system.subtitle': 'Advanced customer behavior and credit analysis',
    'system.lastUpdate': 'Last Update',
    
    // Navigation
    'nav.customers': 'Customers',
    'nav.creditCalculator': 'Credit Calculator',
    'nav.paymentAnalysis': 'Payment Analysis',
    'nav.reports': 'Reports',
    
    // Buttons
    'btn.addCustomer': 'Add Customer',
    'btn.importData': 'Import Data',
    'btn.exportData': 'Export Data',
    'btn.viewDetails': 'View Details',
    'btn.save': 'Save',
    'btn.cancel': 'Cancel',
    'btn.delete': 'Delete',
    'btn.edit': 'Edit',
    'btn.close': 'Close',
    
    // Search and filters
    'search.placeholder': 'Search by code, name, or phone...',
    'filter.all': 'All',
    
    // Customer status
    'status.excellent': 'Excellent',
    'status.good': 'Good',
    'status.fair': 'Fair',
    'status.poor': 'Poor',
    
    // Messages
    'msg.noCustomers': 'No customer data available',
    'msg.noSearchResults': 'No search results found',
    'msg.loading': 'Loading...',
    'msg.error': 'An error occurred',
    
    // Customer fields
    'field.customerCode': 'Customer Code',
    'field.name': 'Name',
    'field.phone': 'Phone',
    'field.creditScore': 'Credit Score',
    'field.paymentCommitment': 'Payment Commitment',
    'field.hagglingLevel': 'Haggling Level',
    'field.purchaseWillingness': 'Purchase Willingness',
    'field.lastPayment': 'Last Payment',
    'field.totalDebt': 'Total Debt',
    'field.status': 'Status',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'ar';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.body.style.direction = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};