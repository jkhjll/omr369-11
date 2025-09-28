import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { UserPlus, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface CustomerData {
  id?: string;
  customerCode: string;
  name: string;
  phone: string;
  creditScore: number;
  paymentCommitment: number;
  hagglingLevel: number;
  purchaseWillingness: number;
  lastPayment: string;
  totalDebt: number;
  installmentAmount: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
}

interface AddCustomerProps {
  onCustomerAdded: (customer: CustomerData & { id: string }) => void;
}

export function AddCustomer({ onCustomerAdded }: AddCustomerProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [formData, setFormData] = useState<CustomerData>({
    customerCode: 'سيتم توليده تلقائياً',
    name: '',
    phone: '',
    creditScore: 650,
    paymentCommitment: 75,
    hagglingLevel: 5,
    purchaseWillingness: 7,
    lastPayment: '',
    totalDebt: 0,
    installmentAmount: 0,
    status: 'fair'
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerData, string>>>({});
  const { toast } = useToast();

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CustomerData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('validation.nameRequired') || 'Customer name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t('validation.phoneRequired') || 'Phone number is required';
    } else if (!/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = t('validation.phoneInvalid') || 'Invalid phone number';
    }

    if (formData.creditScore < 300 || formData.creditScore > 850) {
      newErrors.creditScore = t('validation.creditScoreRange') || 'Credit score must be between 300 and 850';
    }

    if (formData.totalDebt < 0) {
      newErrors.totalDebt = t('validation.debtNegative') || 'Total debt cannot be negative';
    }

    if (formData.installmentAmount < 0) {
      newErrors.installmentAmount = 'مبلغ القسط لا يمكن أن يكون سالباً';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CustomerData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // إزالة الخطأ عند التعديل
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // تحديث الحالة تلقائياً بناءً على الدرجة الائتمانية
    if (field === 'creditScore') {
      const creditScore = value as number;
      let status: CustomerData['status'];
      if (creditScore >= 750) status = 'excellent';
      else if (creditScore >= 700) status = 'good';
      else if (creditScore >= 600) status = 'fair';
      else status = 'poor';
      
      setFormData(prev => ({ ...prev, status }));
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      toast({
        title: t('toast.dataError') || "Data Error",
        description: t('toast.fixErrors') || "Please fix errors before saving",
        variant: "destructive",
      });
      return;
    }

    const newCustomer: CustomerData & { id: string } = {
      ...formData,
      customerCode: '', // سيتم توليده تلقائياً في قاعدة البيانات
      id: `customer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    try {
      await onCustomerAdded(newCustomer);
      
      // إعادة تعيين النموذج فقط في حالة النجاح
      setFormData({
        customerCode: 'سيتم توليده تلقائياً',
        name: '',
        phone: '',
        creditScore: 650,
        paymentCommitment: 75,
        hagglingLevel: 5,
        purchaseWillingness: 7,
        lastPayment: '',
        totalDebt: 0,
        installmentAmount: 0,
        status: 'fair'
      });
      
      setIsOpen(false);
      setErrors({});
      
    } catch (error) {
      console.error('خطأ في إضافة العميل:', error);
      // لا نقوم بإعادة تعيين النموذج في حالة الخطأ
    }
  }, [formData, validateForm, onCustomerAdded, toast, t]);
    

  const handleCancel = () => {
    setIsOpen(false);
    setErrors({});
    // إعادة تعيين النموذج عند الإلغاء
    setFormData({
      customerCode: 'سيتم توليده تلقائياً',
      name: '',
      phone: '',
      creditScore: 650,
      paymentCommitment: 75,
      hagglingLevel: 5,
      purchaseWillingness: 7,
      lastPayment: '',
      totalDebt: 0,
      installmentAmount: 0,
      status: 'fair'
    });
  };

  const getStatusColor = (status: CustomerData['status']) => {
    switch (status) {
      case 'excellent': return 'text-success';
      case 'good': return 'text-accent-foreground';
      case 'fair': return 'text-warning-foreground';
      case 'poor': return 'text-destructive';
    }
  };

  const getStatusLabel = (status: CustomerData['status']) => {
    switch (status) {
      case 'excellent': return t('status.excellent');
      case 'good': return t('status.good');
      case 'fair': return t('status.fair');
      case 'poor': return t('status.poor');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-accent text-accent-foreground">
          <UserPlus className="h-4 w-4 ml-2" />
          {t('btn.addCustomer')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{t('dialog.addCustomer') || 'Add New Customer'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* المعلومات الأساسية */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t('section.basicInfo') || 'Basic Information'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerCode">{t('field.customerCode')} *</Label>
                <Input
                  id="customerCode"
                  value="سيتم توليده تلقائياً"
                  disabled={true}
                  className="bg-muted text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">سيتم توليد الكود تلقائياً بالتنسيق C-1, C-2, إلخ</p>
              </div>

              <div>
                <Label htmlFor="name">{t('field.name')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={t('placeholder.name') || 'Full customer name'}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="phone">{t('field.phone')} *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="01012345678"
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
              </div>

              <div>
                <Label htmlFor="lastPayment">{t('field.lastPayment')}</Label>
                <Input
                  id="lastPayment"
                  type="date"
                  value={formData.lastPayment}
                  onChange={(e) => handleInputChange('lastPayment', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="totalDebt">{t('field.totalDebt')} ({t('currency') || 'EGP'})</Label>
                <Input
                  id="totalDebt"
                  type="number"
                  min="0"
                  value={formData.totalDebt}
                  onChange={(e) => handleInputChange('totalDebt', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className={errors.totalDebt ? 'border-destructive' : ''}
                />
                {errors.totalDebt && <p className="text-sm text-destructive mt-1">{errors.totalDebt}</p>}
              </div>

              <div>
                <Label htmlFor="installmentAmount">مبلغ القسط ({t('currency') || 'EGP'})</Label>
                <Input
                  id="installmentAmount"
                  type="number"
                  min="0"
                  value={formData.installmentAmount}
                  onChange={(e) => handleInputChange('installmentAmount', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className={errors.installmentAmount ? 'border-destructive' : ''}
                />
                {errors.installmentAmount && <p className="text-sm text-destructive mt-1">{errors.installmentAmount}</p>}
              </div>
            </div>
          </Card>

          {/* التقييمات والمؤشرات */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t('section.ratings') || 'Ratings and Indicators'}</h3>
            <div className="space-y-6">
              <div>
                <Label htmlFor="creditScore">{t('field.creditScore')} (300-850)</Label>
                <div className="mt-2">
                  <Slider
                    value={[formData.creditScore]}
                    onValueChange={(value) => handleInputChange('creditScore', value[0])}
                    min={300}
                    max={850}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>300</span>
                    <span className="font-semibold">{formData.creditScore}</span>
                    <span>850</span>
                  </div>
                </div>
                {errors.creditScore && <p className="text-sm text-destructive mt-1">{errors.creditScore}</p>}
              </div>

              <div>
                <Label htmlFor="paymentCommitment">{t('field.paymentCommitment')} (%)</Label>
                <div className="mt-2">
                  <Slider
                    value={[formData.paymentCommitment]}
                    onValueChange={(value) => handleInputChange('paymentCommitment', value[0])}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>0%</span>
                    <span className="font-semibold">{formData.paymentCommitment}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="hagglingLevel">{t('field.hagglingLevel')} (1-10)</Label>
                  <div className="mt-2">
                    <Slider
                      value={[formData.hagglingLevel]}
                      onValueChange={(value) => handleInputChange('hagglingLevel', value[0])}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>1</span>
                      <span className="font-semibold">{formData.hagglingLevel}</span>
                      <span>10</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="purchaseWillingness">{t('field.purchaseWillingness')} (1-10)</Label>
                  <div className="mt-2">
                    <Slider
                      value={[formData.purchaseWillingness]}
                      onValueChange={(value) => handleInputChange('purchaseWillingness', value[0])}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>1</span>
                      <span className="font-semibold">{formData.purchaseWillingness}</span>
                      <span>10</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="status">{t('field.status')}</Label>
                <div className="mt-2 flex items-center gap-4">
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">{t('status.excellent')}</SelectItem>
                      <SelectItem value="good">{t('status.good')}</SelectItem>
                      <SelectItem value="fair">{t('status.fair')}</SelectItem>
                      <SelectItem value="poor">{t('status.poor')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className={`text-sm font-medium ${getStatusColor(formData.status)}`}>
                    {getStatusLabel(formData.status)}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* أزرار الحفظ والإلغاء */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 ml-2" />
              {t('btn.cancel')}
            </Button>
            <Button onClick={handleSubmit} className="gradient-secondary text-secondary-foreground">
              <Save className="h-4 w-4 ml-2" />
              {t('btn.saveCustomer') || 'Save Customer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}