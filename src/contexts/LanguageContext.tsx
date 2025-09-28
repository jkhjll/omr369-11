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
    'btn.retry': 'إعادة المحاولة',
    
    // Search and filters
    'search.placeholder': 'البحث بالكود أو الاسم أو رقم الهاتف...',
    'filter.all': 'الكل',
    
    // Customer status
    'status.excellent': 'ممتاز',
    'status.good': 'جيد',
    'status.fair': 'مقبول',
    'status.poor': 'ضعيف',
    'status.unknown': 'غير محدد',
    
    // Messages
    'msg.noCustomers': 'لا توجد بيانات عملاء',
    'msg.noCustomersDesc': 'ابدأ بإضافة بيانات العملاء لتحليل سلوكهم الشرائي والائتماني',
    'msg.noSearchResults': 'لا توجد نتائج للبحث',
    'msg.noSearchResultsDesc': 'جرب البحث بمصطلحات أخرى أو امسح مربع البحث لعرض جميع العملاء',
    'msg.loading': 'جاري التحميل...',
    'msg.loadingCustomers': 'يتم جلب بيانات العملاء من قاعدة البيانات',
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

    // Stats
    'stats.totalCustomers': 'إجمالي العملاء',
    'stats.avgCreditScore': 'متوسط الدرجة الائتمانية',
    'stats.paymentRate': 'معدل الالتزام بالدفع',
    'stats.behaviorIndex': 'مؤشر سلوك الشراء',

    // Dialog
    'dialog.confirmDelete': 'تأكيد الحذف',
    'dialog.confirmDeleteDesc': 'هل أنت متأكد من حذف هذا العميل؟ هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع البيانات المرتبطة بهذا العميل.',
    'dialog.addCustomer': 'إضافة عميل جديد',

    // Sections
    'section.basicInfo': 'المعلومات الأساسية',
    'section.ratings': 'التقييمات والمؤشرات',

    // Placeholders
    'placeholder.customerCode': 'مثال: C001',
    'placeholder.name': 'اسم العميل الكامل',

    // Validation
    'validation.customerCodeRequired': 'كود العميل مطلوب',
    'validation.nameRequired': 'اسم العميل مطلوب',
    'validation.phoneRequired': 'رقم الهاتف مطلوب',
    'validation.phoneInvalid': 'رقم الهاتف غير صحيح',
    'validation.creditScoreRange': 'الدرجة الائتمانية يجب أن تكون بين 300 و 850',
    'validation.debtNegative': 'إجمالي الدين لا يمكن أن يكون سالباً',

    // Toast messages
    'toast.dataError': 'خطأ في البيانات',
    'toast.fixErrors': 'يرجى تصحيح الأخطاء قبل الحفظ',
    'toast.customerAdded': 'تم إضافة العميل بنجاح',
    'toast.customerAddedDesc': 'تم إضافة {name} إلى قاعدة البيانات',

    // Currency
    'currency': 'ج.م',

    // Additional messages
    'msg.selectCustomer': 'اختر عميلاً لعرض تحليل الدفع',
    'msg.selectCustomerDesc': 'قم بإضافة بيانات العملاء أولاً ثم اختر عميلاً من قائمة العملاء لعرض تحليل مفصل لتاريخ دفعاته',
    'msg.orSelectFrom': 'أو اختر من العملاء المتاحين:',

    // Button labels
    'btn.saveCustomer': 'حفظ العميل',

    // Credit Calculator
    'creditCalc.title': 'حاسبة الحد الائتماني',
    'creditCalc.subtitle': 'احسب الحد الائتماني المناسب بناءً على البيانات المالية',
    'creditCalc.customer': 'العميل (اختياري)',
    'creditCalc.selectCustomer': 'اختر عميلاً (اختياري)',
    'creditCalc.monthlyIncome': 'الدخل الشهري (ج.م)',
    'creditCalc.monthlyIncomeExample': 'مثال: 15000',
    'creditCalc.currentDebt': 'إجمالي الديون الحالية (ج.م)',
    'creditCalc.currentDebtExample': 'مثال: 5000',
    'creditCalc.creditScore': 'الدرجة الائتمانية',
    'creditCalc.creditScoreExample': 'مثال: 750',
    'creditCalc.paymentHistory': 'تاريخ الدفع (%)',
    'creditCalc.paymentHistoryExample': 'مثال: 95',
    'creditCalc.yearsWithStore': 'عدد سنوات التعامل',
    'creditCalc.yearsExample': 'مثال: 2',
    'creditCalc.calculate': 'احسب الحد الائتماني',
    'creditCalc.suggestedLimit': 'الحد الائتماني المقترح',
    'creditCalc.riskLevel': 'مستوى المخاطر',
    'creditCalc.factors': 'العوامل المؤثرة',
    'creditCalc.saving': 'جاري الحفظ...',
    'creditCalc.saveResult': 'حفظ النتيجة',

    // Reports
    'reports.title': 'التقارير والتحليلات',
    'reports.subtitle': 'إنشاء وإدارة التقارير التحليلية',
    'reports.customerReport': 'تقرير العملاء',
    'reports.paymentReport': 'تقرير الدفع',
    'reports.customReport': 'تقرير مخصص',
    'reports.noReports': 'لا توجد تقارير',
    'reports.noReportsDesc': 'ابدأ بإنشاء تقارير تحليلية لبيانات العملاء والدفعات',
    'reports.createFirst': 'إنشاء أول تقرير',
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
    'btn.retry': 'Retry',
    
    // Search and filters
    'search.placeholder': 'Search by code, name, or phone...',
    'filter.all': 'All',
    
    // Customer status
    'status.excellent': 'Excellent',
    'status.good': 'Good',
    'status.fair': 'Fair',
    'status.poor': 'Poor',
    'status.unknown': 'Unknown',
    
    // Messages
    'msg.noCustomers': 'No customer data available',
    'msg.noCustomersDesc': 'Start by adding customer data to analyze their purchasing and credit behavior',
    'msg.noSearchResults': 'No search results found',
    'msg.noSearchResultsDesc': 'Try searching with different terms or clear the search box to view all customers',
    'msg.loading': 'Loading...',
    'msg.loadingCustomers': 'Fetching customer data from database',
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

    // Stats
    'stats.totalCustomers': 'Total Customers',
    'stats.avgCreditScore': 'Average Credit Score',
    'stats.paymentRate': 'Payment Commitment Rate',
    'stats.behaviorIndex': 'Purchase Behavior Index',

    // Dialog
    'dialog.confirmDelete': 'Confirm Delete',
    'dialog.confirmDeleteDesc': 'Are you sure you want to delete this customer? This action cannot be undone and will delete all data associated with this customer.',
    'dialog.addCustomer': 'Add New Customer',

    // Sections
    'section.basicInfo': 'Basic Information',
    'section.ratings': 'Ratings and Indicators',

    // Placeholders
    'placeholder.customerCode': 'e.g., C001',
    'placeholder.name': 'Full customer name',

    // Validation
    'validation.customerCodeRequired': 'Customer code is required',
    'validation.nameRequired': 'Customer name is required',
    'validation.phoneRequired': 'Phone number is required',
    'validation.phoneInvalid': 'Invalid phone number',
    'validation.creditScoreRange': 'Credit score must be between 300 and 850',
    'validation.debtNegative': 'Total debt cannot be negative',

    // Toast messages
    'toast.dataError': 'Data Error',
    'toast.fixErrors': 'Please fix errors before saving',
    'toast.customerAdded': 'Customer Added Successfully',
    'toast.customerAddedDesc': '{name} has been added to the database',

    // Currency
    'currency': 'EGP',

    // Additional messages
    'msg.selectCustomer': 'Select a customer to view payment analysis',
    'msg.selectCustomerDesc': 'Add customer data first, then select a customer from the customer list to view detailed payment history analysis',
    'msg.orSelectFrom': 'Or select from available customers:',

    // Button labels
    'btn.saveCustomer': 'Save Customer',

    // Credit Calculator
    'creditCalc.title': 'Credit Limit Calculator',
    'creditCalc.subtitle': 'Calculate appropriate credit limit based on financial data',
    'creditCalc.customer': 'Customer (Optional)',
    'creditCalc.selectCustomer': 'Select a customer (optional)',
    'creditCalc.monthlyIncome': 'Monthly Income (EGP)',
    'creditCalc.monthlyIncomeExample': 'e.g., 15000',
    'creditCalc.currentDebt': 'Total Current Debt (EGP)',
    'creditCalc.currentDebtExample': 'e.g., 5000',
    'creditCalc.creditScore': 'Credit Score',
    'creditCalc.creditScoreExample': 'e.g., 750',
    'creditCalc.paymentHistory': 'Payment History (%)',
    'creditCalc.paymentHistoryExample': 'e.g., 95',
    'creditCalc.yearsWithStore': 'Years with Store',
    'creditCalc.yearsExample': 'e.g., 2',
    'creditCalc.calculate': 'Calculate Credit Limit',
    'creditCalc.suggestedLimit': 'Suggested Credit Limit',
    'creditCalc.riskLevel': 'Risk Level',
    'creditCalc.factors': 'Influencing Factors',
    'creditCalc.saving': 'Saving...',
    'creditCalc.saveResult': 'Save Result',

    // Reports
    'reports.title': 'Reports and Analytics',
    'reports.subtitle': 'Create and manage analytical reports',
    'reports.customerReport': 'Customer Report',
    'reports.paymentReport': 'Payment Report',
    'reports.customReport': 'Custom Report',
    'reports.noReports': 'No reports available',
    'reports.noReportsDesc': 'Start by creating analytical reports for customer and payment data',
    'reports.createFirst': 'Create First Report',
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