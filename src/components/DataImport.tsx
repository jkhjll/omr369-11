import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import * as XLSX from 'xlsx';

interface Customer {
  name: string;
  phone: string;
  credit_score: number;
  payment_commitment: number;
  haggling_level: number;
  purchase_willingness: number;
  total_debt: number;
  installment_amount: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
}

interface DataImportProps {
  onDataImported: (customers: Customer[]) => void;
  children: React.ReactNode;
}

export const DataImport: React.FC<DataImportProps> = ({ onDataImported, children }) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setSuccess(null);
    }
  };

  const processFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const customers: Customer[] = jsonData.map((row: any, index: number) => {
        // Map common column names (both Arabic and English)
        const name = row['الاسم'] || row['Name'] || row['name'] || row['اسم العميل'] || '';
        const phone = row['الهاتف'] || row['Phone'] || row['phone'] || row['رقم الهاتف'] || '';
        const creditScore = parseInt(row['الدرجة الائتمانية'] || row['Credit Score'] || row['credit_score'] || '650');
        const paymentCommitment = parseInt(row['التزام الدفع'] || row['Payment Commitment'] || row['payment_commitment'] || '80');
        const hagglingLevel = parseInt(row['مستوى المساومة'] || row['Haggling Level'] || row['haggling_level'] || '5');
        const purchaseWillingness = parseInt(row['الرغبة في الشراء'] || row['Purchase Willingness'] || row['purchase_willingness'] || '7');
        const totalDebt = parseFloat(row['إجمالي الدين'] || row['Total Debt'] || row['total_debt'] || '0');
        const installmentAmount = parseFloat(row['مبلغ القسط'] || row['Installment Amount'] || row['installment_amount'] || '0');
        
        // Determine status based on credit score
        let status: 'excellent' | 'good' | 'fair' | 'poor' = 'fair';
        if (creditScore >= 750) status = 'excellent';
        else if (creditScore >= 650) status = 'good';
        else if (creditScore >= 550) status = 'fair';
        else status = 'poor';

        if (!name || !phone) {
          throw new Error(`${t('import.missingData')} ${index + 1}`);
        }

        return {
          name,
          phone,
          credit_score: Math.max(300, Math.min(850, creditScore)),
          payment_commitment: Math.max(0, Math.min(100, paymentCommitment)),
          haggling_level: Math.max(1, Math.min(10, hagglingLevel)),
          purchase_willingness: Math.max(1, Math.min(10, purchaseWillingness)),
          total_debt: Math.max(0, totalDebt),
          installment_amount: Math.max(0, installmentAmount),
          status
        };
      });

      if (customers.length === 0) {
        throw new Error(t('import.noValidData'));
      }

      onDataImported(customers);
      setSuccess(`${t('import.success')} ${customers.length} ${t('import.customersImported')}`);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Close dialog after successful import
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(null);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : t('import.processingError'));
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        resetForm();
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t('import.title')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {t('import.description')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">{t('import.selectFile')}</Label>
            <Input
              id="file-upload"
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              disabled={isProcessing}
            />
          </div>

          {file && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="text-sm">{file.name}</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isProcessing}
            >
              {t('btn.cancel')}
            </Button>
            <Button
              onClick={processFile}
              disabled={!file || isProcessing}
            >
              {isProcessing ? t('import.processing') : t('import.import')}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            <div className="font-medium mb-1">{t('import.supportedColumns')}:</div>
            <div className="grid grid-cols-2 gap-1">
              <div>• {t('field.name')} / Name</div>
              <div>• {t('field.phone')} / Phone</div>
              <div>• {t('field.creditScore')} / Credit Score</div>
              <div>• {t('field.paymentCommitment')} / Payment Commitment</div>
              <div>• {t('field.totalDebt')} / Total Debt</div>
              <div>• {t('field.installmentAmount')} / Installment Amount</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};