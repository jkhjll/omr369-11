import React, { useState, useCallback } from 'react';
import { Upload, FileText, CircleAlert as AlertCircle, CircleCheck as CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { useToast } from './ui/use-toast';
import * as XLSX from 'xlsx';

interface Customer {
  name: string;
  phone: string;
  credit_score: number;
  payment_commitment: number;
  haggling_level: number;
  purchase_willingness: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  total_debt?: number;
  installment_amount?: number;
}

interface DataImportProps {
  onDataImported: (customers: Customer[]) => void;
}

export default function DataImport({ onDataImported }: DataImportProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const validateCustomerData = (data: any[]): Customer[] => {
    const validCustomers: Customer[] = [];
    const errors: string[] = [];

    data.forEach((row, index) => {
      try {
        const customer: Customer = {
          name: String(row.name || row.Name || '').trim(),
          phone: String(row.phone || row.Phone || '').trim(),
          credit_score: Number(row.credit_score || row['Credit Score'] || 0),
          payment_commitment: Number(row.payment_commitment || row['Payment Commitment'] || 0),
          haggling_level: Number(row.haggling_level || row['Haggling Level'] || 1),
          purchase_willingness: Number(row.purchase_willingness || row['Purchase Willingness'] || 1),
          status: (row.status || row.Status || 'fair').toLowerCase() as Customer['status'],
          total_debt: Number(row.total_debt || row['Total Debt'] || 0),
          installment_amount: Number(row.installment_amount || row['Installment Amount'] || 0),
        };

        // Validate required fields
        if (!customer.name) {
          errors.push(`Row ${index + 1}: Name is required`);
          return;
        }
        if (!customer.phone) {
          errors.push(`Row ${index + 1}: Phone is required`);
          return;
        }
        if (customer.credit_score < 300 || customer.credit_score > 850) {
          errors.push(`Row ${index + 1}: Credit score must be between 300-850`);
          return;
        }
        if (customer.payment_commitment < 0 || customer.payment_commitment > 100) {
          errors.push(`Row ${index + 1}: Payment commitment must be between 0-100`);
          return;
        }
        if (!['excellent', 'good', 'fair', 'poor'].includes(customer.status)) {
          customer.status = 'fair'; // Default fallback
        }

        validCustomers.push(customer);
      } catch (err) {
        errors.push(`Row ${index + 1}: Invalid data format`);
      }
    });

    if (errors.length > 0) {
      throw new Error(errors.slice(0, 5).join('; ') + (errors.length > 5 ? '...' : ''));
    }

    return validCustomers;
  };

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
        throw new Error('The file appears to be empty or has no valid data');
      }

      const validatedCustomers = validateCustomerData(jsonData);
      setPreviewData(validatedCustomers.slice(0, 5)); // Show first 5 for preview
      
      toast({
        title: "File processed successfully",
        description: `Found ${validatedCustomers.length} valid customer records`,
      });

      return validatedCustomers;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process file';
      setError(errorMessage);
      toast({
        title: "Import failed",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Please select a valid Excel (.xlsx, .xls) or CSV file');
      return;
    }

    const customers = await processFile(file);
    if (customers) {
      onDataImported(customers);
    }
  }, [processFile, onDataImported]);

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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Customer Data
        </CardTitle>
        <CardDescription>
          Upload an Excel or CSV file containing customer information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
            {isDragging ? 'Drop your file here' : 'Drag and drop your file here'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Supports Excel (.xlsx, .xls) and CSV files
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
            {isProcessing ? 'Processing...' : 'Choose File'}
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
              Preview of imported data (showing first 5 records):
              <div className="mt-2 text-xs">
                {previewData.map((customer, index) => (
                  <div key={index} className="py-1">
                    {customer.name} - {customer.phone} (Score: {customer.credit_score})
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Required columns:</strong> name, phone, credit_score, payment_commitment, haggling_level, purchase_willingness, status</p>
          <p><strong>Optional columns:</strong> total_debt, installment_amount</p>
          <p><strong>Status values:</strong> excellent, good, fair, poor</p>
        </div>
      </CardContent>
    </Card>
  );
}