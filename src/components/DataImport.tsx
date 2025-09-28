import React, { useState, useCallback } from 'react';
import { Upload, FileText, CircleAlert as AlertCircle, CircleCheck as CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
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
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
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

  return (
    <div className="space-y-4">
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
              input.accept = '.xlsx,.xls,.csv';
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
          <p><strong>Optional columns:</strong> totalDebt, installmentAmount, lastPayment</p>
          <p><strong>Status values:</strong> excellent, good, fair, poor</p>
        </div>
    </div>
  );
}