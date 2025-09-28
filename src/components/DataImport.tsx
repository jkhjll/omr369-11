import React, { useState, useCallback } from 'react';
import { Upload, FileText, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Download } from 'lucide-react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Alert, AlertDescription } from './ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import * as XLSX from 'xlsx';
import { CustomerData } from '@/hooks/useCustomers';

// واجهة بيانات العميل للاستيراد
interface ImportCustomer {
  name: string;
  phone: string;
  creditScore: number;
  paymentCommitment: number;
  hagglingLevel: number;
  purchaseWillingness: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  totalDebt?: number;
  installmentAmount?: number;
}

interface DataImportProps {
  onDataImported: (customers: Omit<CustomerData, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
}

export default function DataImport({ onDataImported }: DataImportProps) {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<ImportCustomer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // دالة التحقق من صحة بيانات العملاء
  const validateCustomerData = (data: any[]): Omit<CustomerData, 'id' | 'createdAt' | 'updatedAt'>[] => {
    const validCustomers: Omit<CustomerData, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    const errors: string[] = [];

    data.forEach((row, index) => {
      try {
        const customer: Omit<CustomerData, 'id' | 'createdAt' | 'updatedAt'> = {
          customerCode: `C-${Date.now()}-${index}`, // توليد كود مؤقت
          name: String(row.name || row.Name || '').trim(),
          phone: String(row.phone || row.Phone || '').trim(),
          creditScore: Number(row.credit_score || row.creditScore || row['Credit Score'] || 0),
          paymentCommitment: Number(row.payment_commitment || row.paymentCommitment || row['Payment Commitment'] || 0),
          hagglingLevel: Number(row.haggling_level || row.hagglingLevel || row['Haggling Level'] || 1),
          purchaseWillingness: Number(row.purchase_willingness || row.purchaseWillingness || row['Purchase Willingness'] || 1),
          status: (row.status || row.Status || 'fair').toLowerCase() as Customer['status'],
          lastPayment: String(row.last_payment || row.lastPayment || row['Last Payment'] || ''),
          totalDebt: Number(row.total_debt || row.totalDebt || row['Total Debt'] || 0),
          installmentAmount: Number(row.installment_amount || row.installmentAmount || row['Installment Amount'] || 0),
        };

        // التحقق من الحقول المطلوبة
        if (!customer.name) {
          errors.push(`${t('import.missingData')} ${index + 1}: ${t('field.name')}`);
          return;
        }
        if (!customer.phone) {
          errors.push(`${t('import.missingData')} ${index + 1}: ${t('field.phone')}`);
          return;
        }
        if (customer.creditScore < 300 || customer.creditScore > 850) {
          errors.push(`${t('import.missingData')} ${index + 1}: ${t('validation.creditScoreRange')}`);
          return;
        }
        if (customer.paymentCommitment < 0 || customer.paymentCommitment > 100) {
          errors.push(`${t('import.missingData')} ${index + 1}: Payment commitment must be between 0-100`);
          return;
        }
        if (!['excellent', 'good', 'fair', 'poor'].includes(customer.status)) {
          customer.status = 'fair'; // قيمة افتراضية
        }

        validCustomers.push(customer);
      } catch (err) {
        errors.push(`${t('import.missingData')} ${index + 1}: Invalid data format`);
      }
    });

    if (errors.length > 0) {
      throw new Error(errors.slice(0, 5).join('; ') + (errors.length > 5 ? '...' : ''));
    }

    return validCustomers;
  };

  // دالة معالجة الملف
  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error(t('import.noValidData'));
      }

      const validatedCustomers = validateCustomerData(jsonData);
      setPreviewData(validatedCustomers.slice(0, 5)); // Show first 5 for preview
      
      toast({
        title: t('import.success'),
        description: `${validatedCustomers.length} ${t('import.customersImported')}`,
      });

      return validatedCustomers;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('import.processingError');
      setError(errorMessage);
      toast({
        title: t('import.processingError'),
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  // دالة اختيار الملف
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    // التحقق من أنواع الملفات الجديدة
    if (fileExtension === 'docx' || fileExtension === 'doc' || fileExtension === 'pdf') {
      setError(t('import.unsupportedStructuredData'));
      toast({
        title: t('import.processingError'),
        description: t('import.unsupportedStructuredData'),
        variant: "destructive",
      });
      return;
    }
    
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/pdf'
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv|docx|doc|pdf)$/i)) {
      setError(t('import.supportedFormats'));
      return;
    }

    const customers = await processFile(file);
    if (customers) {
      onDataImported(customers);
    }
  }, [processFile, onDataImported]);

  // دوال السحب والإفلات
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // دالة تحميل الملفات المثالية
  const handleDownloadTemplate = useCallback((type: 'word' | 'excel' | 'csv') => {
    let content = '';
    let fileName = '';
    let mimeType = '';
    
    const headers = 'name,phone,creditScore,paymentCommitment,hagglingLevel,purchaseWillingness,status,totalDebt,installmentAmount,lastPayment';
    const sampleData = 'أحمد محمد,01012345678,750,85,3,8,excellent,5000,500,2024-01-15';
    
    switch (type) {
      case 'csv':
        content = `${headers}\n${sampleData}\nفاطمة علي,01098765432,680,75,5,7,good,3000,300,2024-01-10`;
        fileName = 'نموذج_بيانات_العملاء.csv';
        mimeType = 'text/csv;charset=utf-8;';
        break;
      case 'excel':
        // إنشاء ملف Excel باستخدام XLSX
        const ws = XLSX.utils.aoa_to_sheet([
          ['name', 'phone', 'creditScore', 'paymentCommitment', 'hagglingLevel', 'purchaseWillingness', 'status', 'totalDebt', 'installmentAmount', 'lastPayment'],
          ['أحمد محمد', '01012345678', 750, 85, 3, 8, 'excellent', 5000, 500, '2024-01-15'],
          ['فاطمة علي', '01098765432', 680, 75, 5, 7, 'good', 3000, 300, '2024-01-10'],
          ['محمد أحمد', '01055555555', 620, 70, 6, 6, 'fair', 8000, 800, '2024-01-05']
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'بيانات العملاء');
        
        // إضافة ورقة عمل للشرح
        const explanationData = [
          ['اسم العمود', 'الوصف', 'نوع البيانات', 'القيم المسموحة'],
          ['name', 'اسم العميل الكامل', 'نص', 'أي نص'],
          ['phone', 'رقم الهاتف', 'نص', 'أرقام فقط'],
          ['creditScore', 'الدرجة الائتمانية', 'رقم', '300-850'],
          ['paymentCommitment', 'التزام الدفع (%)', 'رقم', '0-100'],
          ['hagglingLevel', 'مستوى المساومة', 'رقم', '1-10'],
          ['purchaseWillingness', 'الرغبة في الشراء', 'رقم', '1-10'],
          ['status', 'حالة العميل', 'نص', 'excellent, good, fair, poor'],
          ['totalDebt', 'إجمالي الدين (اختياري)', 'رقم', 'أي رقم موجب'],
          ['installmentAmount', 'مبلغ القسط (اختياري)', 'رقم', 'أي رقم موجب'],
          ['lastPayment', 'آخر دفعة (اختياري)', 'تاريخ', 'YYYY-MM-DD']
        ];
        const explanationWs = XLSX.utils.aoa_to_sheet(explanationData);
        XLSX.utils.book_append_sheet(wb, explanationWs, 'شرح الأعمدة');
        
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'نموذج_بيانات_العملاء.xlsx';
        link.click();
        URL.revokeObjectURL(url);
        return;
      case 'word':
        // إنشاء محتوى Word بسيط (HTML يمكن فتحه في Word)
        content = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <title>نموذج بيانات العملاء</title>
    <style>
        body { font-family: Arial, sans-serif; direction: rtl; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .header { color: #2c5aa0; margin-bottom: 20px; }
        .description { margin-bottom: 15px; color: #666; }
    </style>
</head>
<body>
    <h1 class="header">نموذج بيانات العملاء</h1>
    <p class="description">هذا نموذج لتنسيق بيانات العملاء المطلوب لاستيراد البيانات في النظام.</p>
    
    <h2>الأعمدة المطلوبة:</h2>
    <table>
        <tr><th>اسم العمود</th><th>الوصف</th><th>نوع البيانات</th><th>القيم المسموحة</th></tr>
        <tr><td>name</td><td>اسم العميل الكامل</td><td>نص</td><td>أي نص</td></tr>
        <tr><td>phone</td><td>رقم الهاتف</td><td>نص</td><td>أرقام فقط</td></tr>
        <tr><td>creditScore</td><td>الدرجة الائتمانية</td><td>رقم</td><td>300-850</td></tr>
        <tr><td>paymentCommitment</td><td>التزام الدفع (%)</td><td>رقم</td><td>0-100</td></tr>
        <tr><td>hagglingLevel</td><td>مستوى المساومة</td><td>رقم</td><td>1-10</td></tr>
        <tr><td>purchaseWillingness</td><td>الرغبة في الشراء</td><td>رقم</td><td>1-10</td></tr>
        <tr><td>status</td><td>حالة العميل</td><td>نص</td><td>excellent, good, fair, poor</td></tr>
    </table>
    
    <h2>الأعمدة الاختيارية:</h2>
    <table>
        <tr><th>اسم العمود</th><th>الوصف</th><th>نوع البيانات</th></tr>
        <tr><td>totalDebt</td><td>إجمالي الدين</td><td>رقم موجب</td></tr>
        <tr><td>installmentAmount</td><td>مبلغ القسط</td><td>رقم موجب</td></tr>
        <tr><td>lastPayment</td><td>آخر دفعة</td><td>تاريخ (YYYY-MM-DD)</td></tr>
    </table>
    
    <h2>مثال على البيانات:</h2>
    <table>
        <tr><th>name</th><th>phone</th><th>creditScore</th><th>paymentCommitment</th><th>hagglingLevel</th><th>purchaseWillingness</th><th>status</th></tr>
        <tr><td>أحمد محمد</td><td>01012345678</td><td>750</td><td>85</td><td>3</td><td>8</td><td>excellent</td></tr>
        <tr><td>فاطمة علي</td><td>01098765432</td><td>680</td><td>75</td><td>5</td><td>7</td><td>good</td></tr>
    </table>
    
    <p><strong>ملاحظة:</strong> لاستيراد البيانات المنظمة، يرجى استخدام ملفات Excel أو CSV فقط.</p>
</body>
</html>`;
        fileName = 'نموذج_بيانات_العملاء.doc';
        mimeType = 'application/msword';
        break;
    }
    
    if (type !== 'excel') {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    }
    
    toast({
      title: t('import.downloadTemplate'),
      description: `تم تحميل ${fileName}`,
    });
  }, [t, toast]);
  return (
    <div className="space-y-4">
      {/* قسم الملفات المثالية */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{t('import.title')}</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              {t('btn.idealFile')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleDownloadTemplate('word')}>
              <FileText className="h-4 w-4 mr-2" />
              {t('btn.idealWord')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownloadTemplate('excel')}>
              <FileText className="h-4 w-4 mr-2" />
              {t('btn.idealExcel')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownloadTemplate('csv')}>
              <FileText className="h-4 w-4 mr-2" />
              {t('btn.idealCsv')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">
            {isDragging ? t('import.dropFile') : t('import.dragDrop')}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            {t('import.supportedFormats')}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.xlsx,.xls,.csv,.docx,.doc,.pdf';
              input.onchange = (e) => {
                const target = e.target as HTMLInputElement;
                handleFileSelect(target.files);
              };
              input.click();
            }}
            disabled={isProcessing}
          >
            {isProcessing ? t('import.processing') : t('import.selectFile')}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {previewData.length > 0 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              {t('import.preview')} ({previewData.length} {t('import.rowsFound')}):
              <div className="mt-2 text-xs">
                {previewData.map((customer, index) => (
                  <div key={index} className="py-1">
                    {customer.name} - {customer.phone} (Score: {customer.creditScore})
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>{t('import.supportedColumns')}:</strong> name, phone, creditScore, paymentCommitment, hagglingLevel, purchaseWillingness, status</p>
          <p><strong>{t('import.optionalColumns')}:</strong> totalDebt, installmentAmount, lastPayment</p>
          <p><strong>{t('import.statusValues')}:</strong> excellent, good, fair, poor</p>
        </div>
    </div>
  );
}