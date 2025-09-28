import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, FileText, CircleAlert as AlertCircle, CircleCheck as CheckCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import * as XLSX from 'xlsx';
import { parse, format, isValid } from 'date-fns';

interface CustomerData {
  id?: string;
  name: string;
  phone: string;
  creditScore: number;
  paymentCommitment: number;
  hagglingLevel: number;
  purchaseWillingness: number;
  lastPayment: string;
  totalDebt: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
}

interface DataImportProps {
  onDataImported: (data: (CustomerData & { id: string })[]) => void;
}

export function DataImport({ onDataImported }: DataImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<CustomerData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const validateCustomerData = (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!data.name || typeof data.name !== 'string') {
      errors.push('اسم العميل مطلوب ويجب أن يكون نص');
    }
    
    if (!data.phone || typeof data.phone !== 'string') {
      errors.push('رقم الهاتف مطلوب ويجب أن يكون نص');
    }
    
    if (typeof data.creditScore !== 'number' || data.creditScore < 300 || data.creditScore > 850) {
      errors.push('الدرجة الائتمانية يجب أن تكون رقم بين 300 و 850');
    }
    
    if (typeof data.paymentCommitment !== 'number' || data.paymentCommitment < 0 || data.paymentCommitment > 100) {
      errors.push('التزام الدفع يجب أن يكون رقم بين 0 و 100');
    }
    
    if (typeof data.hagglingLevel !== 'number' || data.hagglingLevel < 1 || data.hagglingLevel > 10) {
      errors.push('مستوى المساومة يجب أن يكون رقم بين 1 و 10');
    }
    
    if (typeof data.purchaseWillingness !== 'number' || data.purchaseWillingness < 1 || data.purchaseWillingness > 10) {
      errors.push('استعداد الشراء يجب أن يكون رقم بين 1 و 10');
    }
    
    if (!['excellent', 'good', 'fair', 'poor'].includes(data.status)) {
      errors.push('حالة العميل يجب أن تكون: excellent, good, fair, أو poor');
    }

    return { isValid: errors.length === 0, errors };
  };

  const convertDateFormat = (dateString: string): string => {
    if (!dateString) return '';
    
    // Try parsing DD/MM/YYYY format first
    let parsedDate = parse(dateString, 'dd/MM/yyyy', new Date());
    
    // If that fails, try other common formats
    if (!isValid(parsedDate)) {
      parsedDate = parse(dateString, 'MM/dd/yyyy', new Date());
    }
    
    if (!isValid(parsedDate)) {
      parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
    }
    
    // If still invalid, try parsing as ISO string
    if (!isValid(parsedDate)) {
      parsedDate = new Date(dateString);
    }
    
    // Return in YYYY-MM-DD format if valid, otherwise return empty string
    return isValid(parsedDate) ? format(parsedDate, 'yyyy-MM-dd') : '';
  };

  const processCSV = (csvText: string): CustomerData[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data: CustomerData[] = [];
    
    // خريطة لتحويل أسماء الأعمدة المختلفة إلى الأسماء المطلوبة
    const columnMapping: { [key: string]: string } = {
      'name': 'name',
      'الاسم': 'name',
      'اسم': 'name',
      'phone': 'phone',
      'الهاتف': 'phone',
      'هاتف': 'phone',
      'رقم الهاتف': 'phone',
      'creditscore': 'creditScore',
      'credit_score': 'creditScore',
      'الدرجة الائتمانية': 'creditScore',
      'درجة ائتمانية': 'creditScore',
      'paymentcommitment': 'paymentCommitment',
      'payment_commitment': 'paymentCommitment',
      'التزام الدفع': 'paymentCommitment',
      'التزام دفع': 'paymentCommitment',
      'hagglinglevel': 'hagglingLevel',
      'haggling_level': 'hagglingLevel',
      'مستوى المساومة': 'hagglingLevel',
      'مساومة': 'hagglingLevel',
      'purchasewillingness': 'purchaseWillingness',
      'purchase_willingness': 'purchaseWillingness',
      'الرغبة في الشراء': 'purchaseWillingness',
      'استعداد الشراء': 'purchaseWillingness',
      'lastpayment': 'lastPayment',
      'last_payment': 'lastPayment',
      'آخر دفعة': 'lastPayment',
      'اخر دفعة': 'lastPayment',
      'totaldebt': 'totalDebt',
      'total_debt': 'totalDebt',
      'إجمالي الدين': 'totalDebt',
      'اجمالي الدين': 'totalDebt',
      'الدين': 'totalDebt',
      'status': 'status',
      'الحالة': 'status',
      'حالة': 'status'
    };

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const customer: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index];
        const mappedField = columnMapping[header] || header;
        
        // تحويل الأرقام
        if (['creditScore', 'paymentCommitment', 'hagglingLevel', 'purchaseWillingness', 'totalDebt'].includes(mappedField)) {
          customer[mappedField] = parseFloat(value) || 0;
        } else if (mappedField === 'lastPayment') {
          customer[mappedField] = convertDateFormat(value);
        } else {
          customer[mappedField] = value;
        }
      });
      
      // التأكد من وجود جميع الحقول المطلوبة مع قيم افتراضية
      const requiredFields = {
        name: customer.name || '',
        phone: customer.phone || '',
        creditScore: customer.creditScore || 650,
        paymentCommitment: customer.paymentCommitment || 75,
        hagglingLevel: customer.hagglingLevel || 5,
        purchaseWillingness: customer.purchaseWillingness || 7,
        lastPayment: customer.lastPayment || '',
        totalDebt: customer.totalDebt || 0,
        status: customer.status || 'fair'
      };

      // تحديد الحالة تلقائياً إذا لم تكن موجودة
      if (!requiredFields.status || !['excellent', 'good', 'fair', 'poor'].includes(requiredFields.status)) {
        if (requiredFields.creditScore >= 750) requiredFields.status = 'excellent';
        else if (requiredFields.creditScore >= 700) requiredFields.status = 'good';
        else if (requiredFields.creditScore >= 600) requiredFields.status = 'fair';
        else requiredFields.status = 'poor';
      }
      
      data.push(requiredFields as CustomerData);
    }
    
    return data;
  };

  const processExcel = (file: File): Promise<CustomerData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length < 2) {
            throw new Error('الملف يجب أن يحتوي على صف العناوين والبيانات');
          }
          
          const headers = (jsonData[0] as string[]).map(h => h?.toString().trim().toLowerCase());
          const customers: CustomerData[] = [];
          
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            if (!row || row.every(cell => !cell)) continue; // تجاهل الصفوف الفارغة
            
            const customer: any = {};
            
            // خريطة لتحويل أسماء الأعمدة المختلفة إلى الأسماء المطلوبة
            const columnMapping: { [key: string]: string } = {
              'name': 'name',
              'الاسم': 'name',
              'اسم': 'name',
              'phone': 'phone',
              'الهاتف': 'phone',
              'هاتف': 'phone',
              'رقم الهاتف': 'phone',
              'creditscore': 'creditScore',
              'credit_score': 'creditScore',
              'الدرجة الائتمانية': 'creditScore',
              'درجة ائتمانية': 'creditScore',
              'paymentcommitment': 'paymentCommitment',
              'payment_commitment': 'paymentCommitment',
              'التزام الدفع': 'paymentCommitment',
              'التزام دفع': 'paymentCommitment',
              'hagglinglevel': 'hagglingLevel',
              'haggling_level': 'hagglingLevel',
              'مستوى المساومة': 'hagglingLevel',
              'مساومة': 'hagglingLevel',
              'purchasewillingness': 'purchaseWillingness',
              'purchase_willingness': 'purchaseWillingness',
              'الرغبة في الشراء': 'purchaseWillingness',
              'استعداد الشراء': 'purchaseWillingness',
              'lastpayment': 'lastPayment',
              'last_payment': 'lastPayment',
              'آخر دفعة': 'lastPayment',
              'اخر دفعة': 'lastPayment',
              'totaldebt': 'totalDebt',
              'total_debt': 'totalDebt',
              'إجمالي الدين': 'totalDebt',
              'اجمالي الدين': 'totalDebt',
              'الدين': 'totalDebt',
                const customer = {
              'الحالة': 'status',
              'حالة': 'status'
            };

            headers.forEach((header, index) => {
              const value = row[index];
                  lastPayment: convertDateFormat(parts[6]),
              
              // تحويل الأرقام
              if (['creditScore', 'paymentCommitment', 'hagglingLevel', 'purchaseWillingness', 'totalDebt'].includes(mappedField)) {
                customer[mappedField] = parseFloat(value) || 0;
                // تحديد الحالة تلقائياً إذا لم تكن صحيحة
                if (!['excellent', 'good', 'fair', 'poor'].includes(customer.status)) {
                  if (customer.creditScore >= 750) customer.status = 'excellent';
                  else if (customer.creditScore >= 700) customer.status = 'good';
                  else if (customer.creditScore >= 600) customer.status = 'fair';
                  else customer.status = 'poor';
                }
              } else {
                customers.push(customer as CustomerData);
              }
            });
            
            // التأكد من وجود جميع الحقول المطلوبة مع قيم افتراضية
            const requiredFields = {
              name: customer.name || '',
              phone: customer.phone || '',
              creditScore: customer.creditScore || 650,
              paymentCommitment: customer.paymentCommitment || 75,
              hagglingLevel: customer.hagglingLevel || 5,
              purchaseWillingness: customer.purchaseWillingness || 7,
              lastPayment: customer.lastPayment || '',
              totalDebt: customer.totalDebt || 0,
              status: customer.status || 'fair'
            };

            // تحديد الحالة تلقائياً إذا لم تكن موجودة
            if (!requiredFields.status || !['excellent', 'good', 'fair', 'poor'].includes(requiredFields.status)) {
              if (requiredFields.creditScore >= 750) requiredFields.status = 'excellent';
              else if (requiredFields.creditScore >= 700) requiredFields.status = 'good';
              else if (requiredFields.creditScore >= 600) requiredFields.status = 'fair';
              else requiredFields.status = 'poor';
            }
            
            customers.push(requiredFields as CustomerData);
          }
          
          resolve(customers);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('خطأ في قراءة الملف'));
      reader.readAsArrayBuffer(file);
    });
  };

  const processWord = async (file: File): Promise<CustomerData[]> => {
    // استخدام أداة تحليل المستندات المتاحة في Lovable
    try {
      const result = await fetch('/api/parse-document', {
        method: 'POST',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });
      
      if (!result.ok) {
        throw new Error('فشل في تحليل مستند Word');
      }
      
      const parsedContent = await result.text();
      // محاولة استخراج البيانات من النص المحلل
      // هذا يتطلب تنسيق محدد في مستند Word
      const lines = parsedContent.split('\n').filter(line => line.trim());
      const customers: CustomerData[] = [];
      
      // البحث عن جداول أو قوائم في النص
      for (const line of lines) {
        if (line.includes('|') || line.includes('\t')) {
          // محاولة تحليل البيانات المفصولة بـ | أو tab
          const parts = line.split(/[|\t]/).map(p => p.trim());
          if (parts.length >= 8) {
            const customer: any = {
              name: parts[0],
              phone: parts[1],
              creditScore: parseFloat(parts[2]) || 0,
              paymentCommitment: parseFloat(parts[3]) || 0,
              hagglingLevel: parseFloat(parts[4]) || 0,
              purchaseWillingness: parseFloat(parts[5]) || 0,
              lastPayment: parts[6],
              totalDebt: parseFloat(parts[7]) || 0,
              status: parts[8] || 'fair'
            };
            
            // Convert date format
            customer.lastPayment = convertDateFormat(customer.lastPayment);
            
            customers.push(customer);
          }
        }
      }
      
      if (customers.length === 0) {
        throw new Error('لم يتم العثور على بيانات عملاء صالحة في مستند Word. يرجى التأكد من أن البيانات منظمة في جدول أو قائمة مفصولة بـ | أو tabs');
      }
      
      return customers;
    } catch (error) {
      throw new Error('فشل في معالجة مستند Word: ' + (error as Error).message);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setValidationErrors([]);
    setPreviewData([]);

    try {
      setProgress(20);
      let parsedData: CustomerData[] = [];
      
      if (file.name.endsWith('.json')) {
        const text = await file.text();
        const jsonData = JSON.parse(text);
        parsedData = Array.isArray(jsonData) ? jsonData : [jsonData];
      } else if (file.name.endsWith('.csv')) {
        const text = await file.text();
        parsedData = processCSV(text);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        parsedData = await processExcel(file);
      } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        parsedData = await processWord(file);
      } else {
        throw new Error('نوع الملف غير مدعوم. الملفات المدعومة: JSON, CSV, Excel (.xlsx, .xls), Word (.docx, .doc)');
      }

      setProgress(60);

      // التحقق من صحة البيانات
      const errors: string[] = [];
      const validData: CustomerData[] = [];

      parsedData.forEach((customer, index) => {
        const validation = validateCustomerData(customer);
        if (!validation.isValid) {
          errors.push(`السطر ${index + 1}: ${validation.errors.join(', ')}`);
        } else {
          validData.push(customer);
        }
      });

      setProgress(90);

      if (errors.length > 0) {
        setValidationErrors(errors);
      }

      setPreviewData(validData);
      setShowPreview(true);
      setProgress(100);

      toast({
        title: "تم تحليل الملف بنجاح",
        description: `تم العثور على ${validData.length} عميل صالح${errors.length > 0 ? ` و ${errors.length} خطأ` : ''}`,
      });

    } catch (error) {
      toast({
        title: "خطأ في معالجة الملف",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmImport = () => {
    const customersWithIds = previewData.map((customer, index) => ({
      ...customer,
      id: customer.id || `imported-${Date.now()}-${index}`
    }));
    
    onDataImported(customersWithIds);
    setIsOpen(false);
    setShowPreview(false);
    setPreviewData([]);
    setValidationErrors([]);
    setProgress(0);
    
    toast({
      title: "تم استيراد البيانات بنجاح",
      description: `تم إضافة ${previewData.length} عميل إلى النظام`,
    });
  };

  const downloadTemplate = () => {
    // إنشاء نموذج Excel
    const templateData = [
      ['name', 'phone', 'creditScore', 'paymentCommitment', 'hagglingLevel', 'purchaseWillingness', 'lastPayment', 'totalDebt', 'status'],
      ['أحمد محمد علي', '01012345678', 785, 94, 6, 8, '2024-12-15', 12500, 'excellent'],
      ['فاطمة أحمد محمود', '01098765432', 692, 87, 8, 9, '2024-12-10', 8900, 'good'],
      ['محمد أحمد سعد', '01055567890', 620, 75, 7, 6, '2024-12-08', 15000, 'fair']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'بيانات العملاء');
    
    // تحميل ملف Excel
    XLSX.writeFile(workbook, 'نموذج_بيانات_العملاء.xlsx');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gradient-primary text-primary-foreground">
          <Upload className="h-4 w-4 ml-2" />
          {t('btn.importData')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">استيراد بيانات العملاء</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* قسم رفع الملف */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="file-upload" className="text-lg font-semibold">
                  اختر ملف البيانات
                </Label>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <FileText className="h-4 w-4 ml-2" />
                  تحميل نموذج
                </Button>
              </div>
              
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.json,.xlsx,.xls,.docx,.doc"
                ref={fileInputRef}
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="cursor-pointer"
              />
              
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• الملفات المدعومة: CSV, JSON, Excel (.xlsx, .xls), Word (.docx, .doc)</p>
                <p>• الحد الأقصى لحجم الملف: 10 ميجابايت</p>
                <p>• تأكد من أن الملف يحتوي على الحقول المطلوبة</p>
                <p>• لملفات Word: يجب تنظيم البيانات في جدول أو قائمة مفصولة</p>
              </div>
            </div>
          </Card>

          {/* شريط التقدم */}
          {isProcessing && (
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>جاري معالجة الملف...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            </Card>
          )}

          {/* أخطاء التحقق */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-semibold">تم العثور على أخطاء في البيانات:</p>
                  <ul className="list-disc list-inside space-y-1 max-h-32 overflow-y-auto">
                    {validationErrors.slice(0, 10).map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                    {validationErrors.length > 10 && (
                      <li className="text-sm font-medium">
                        ... و {validationErrors.length - 10} أخطاء أخرى
                      </li>
                    )}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* معاينة البيانات */}
          {showPreview && previewData.length > 0 && (
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    معاينة البيانات ({previewData.length} عميل)
                  </h3>
                  <Button onClick={() => setShowPreview(false)} variant="ghost" size="sm">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="text-right p-2 border-b">الاسم</th>
                        <th className="text-right p-2 border-b">الهاتف</th>
                        <th className="text-right p-2 border-b">الدرجة الائتمانية</th>
                        <th className="text-right p-2 border-b">التزام الدفع</th>
                        <th className="text-right p-2 border-b">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 50).map((customer, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{customer.name}</td>
                          <td className="p-2">{customer.phone}</td>
                          <td className="p-2">{customer.creditScore}</td>
                          <td className="p-2">{customer.paymentCommitment}%</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              customer.status === 'excellent' ? 'bg-success/20 text-success' :
                              customer.status === 'good' ? 'bg-accent/20 text-accent-foreground' :
                              customer.status === 'fair' ? 'bg-warning/20 text-warning-foreground' :
                              'bg-destructive/20 text-destructive'
                            }`}>
                              {customer.status === 'excellent' ? 'ممتاز' :
                               customer.status === 'good' ? 'جيد' :
                               customer.status === 'fair' ? 'مقبول' : 'ضعيف'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.length > 50 && (
                    <div className="p-2 text-center text-muted-foreground text-sm border-t">
                      ... و {previewData.length - 50} عميل آخر
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowPreview(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={confirmImport} className="gradient-secondary text-secondary-foreground">
                    <CheckCircle className="h-4 w-4 ml-2" />
                    تأكيد الاستيراد
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* معلومات إضافية */}
          <Card className="p-4 bg-muted/50">
            <h4 className="font-semibold mb-2">الحقول المطلوبة في الملف:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div>• name (الاسم)</div>
              <div>• phone (الهاتف)</div>
              <div>• creditScore (الدرجة الائتمانية: 300-850)</div>
              <div>• paymentCommitment (التزام الدفع: 0-100)</div>
              <div>• hagglingLevel (مستوى المساومة: 1-10)</div>
              <div>• purchaseWillingness (استعداد الشراء: 1-10)</div>
              <div>• lastPayment (آخر دفعة)</div>
              <div>• totalDebt (إجمالي الدين)</div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}