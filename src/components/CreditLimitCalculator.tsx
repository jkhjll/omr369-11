import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, TrendingUp, AlertTriangle, CheckCircle, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  name: string;
  phone: string;
}

export function CreditLimitCalculator() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    monthlyIncome: '',
    currentDebt: '',
    creditScore: '',
    paymentHistory: '',
    yearsWithStore: ''
  });

  const [result, setResult] = useState<{
    creditLimit: number;
    riskLevel: 'low' | 'medium' | 'high';
    factors: Array<{ name: string; impact: number; description: string }>;
  } | null>(null);

  // جلب قائمة العملاء
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في جلب بيانات العملاء",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCreditLimit = () => {
    const income = parseFloat(formData.monthlyIncome) || 0;
    const debt = parseFloat(formData.currentDebt) || 0;
    const score = parseFloat(formData.creditScore) || 0;
    const history = parseFloat(formData.paymentHistory) || 0;
    const years = parseFloat(formData.yearsWithStore) || 0;

    // Credit limit calculation algorithm
    let baseLimit = income * 3; // Base: 3x monthly income
    
    // Adjust based on credit score
    const scoreMultiplier = score / 850;
    baseLimit *= scoreMultiplier;

    // Adjust based on existing debt
    const debtRatio = debt / income;
    if (debtRatio > 0.5) {
      baseLimit *= 0.6; // Reduce by 40% if debt ratio > 50%
    } else if (debtRatio > 0.3) {
      baseLimit *= 0.8; // Reduce by 20% if debt ratio > 30%
    }

    // Adjust based on payment history
    baseLimit *= (history / 100);

    // Adjust based on relationship duration
    if (years >= 2) {
      baseLimit *= 1.2; // 20% bonus for loyal customers
    } else if (years >= 1) {
      baseLimit *= 1.1; // 10% bonus
    }

    // Risk assessment
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    if (score >= 750 && history >= 90 && debtRatio < 0.3) {
      riskLevel = 'low';
    } else if (score < 600 || history < 70 || debtRatio > 0.5) {
      riskLevel = 'high';
    }

    const factors = [
      {
        name: 'الدخل الشهري',
        impact: Math.min(100, (income / 10000) * 100),
        description: 'كلما زاد الدخل، زادت القدرة على الدفع'
      },
      {
        name: 'الدرجة الائتمانية',
        impact: (score / 850) * 100,
        description: 'تعكس التاريخ الائتماني للعميل'
      },
      {
        name: 'تاريخ الدفع',
        impact: history,
        description: 'نسبة الدفعات في الوقت المحدد'
      },
      {
        name: 'نسبة الدين',
        impact: Math.max(0, 100 - (debtRatio * 100)),
        description: 'انخفاض نسبة الدين يزيد من الحد الائتماني'
      },
      {
        name: 'مدة العلاقة',
        impact: Math.min(100, (years / 5) * 100),
        description: 'العملاء الدائمون أكثر موثوقية'
      }
    ];

    setResult({
      creditLimit: Math.round(baseLimit),
      riskLevel,
      factors
    });
  };

  const saveCalculation = async () => {
    if (!result) {
      toast({
        title: "خطأ",
        description: "يجب حساب الحد الائتماني أولاً",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "خطأ",
          description: "يجب تسجيل الدخول أولاً",
          variant: "destructive"
        });
        return;
      }

      const calculationData = {
        user_id: user.id,
        customer_id: selectedCustomerId || null,
        monthly_income: parseFloat(formData.monthlyIncome),
        current_debt: parseFloat(formData.currentDebt) || 0,
        credit_score: parseInt(formData.creditScore),
        payment_history: parseInt(formData.paymentHistory),
        years_with_store: parseFloat(formData.yearsWithStore) || 0,
        calculated_credit_limit: result.creditLimit,
        risk_level: result.riskLevel,
        calculation_factors: result.factors
      };

      const { error } = await supabase
        .from('credit_calculations')
        .insert(calculationData);

      if (error) throw error;

      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ حساب الحد الائتماني"
      });

      // إعادة تعيين النموذج
      setFormData({
        monthlyIncome: '',
        currentDebt: '',
        creditScore: '',
        paymentHistory: '',
        yearsWithStore: ''
      });
      setSelectedCustomerId('');
      setResult(null);

    } catch (error) {
      console.error('Error saving calculation:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في حفظ البيانات",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-success';
      case 'medium': return 'text-warning';
      case 'high': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskText = (risk: string) => {
    switch (risk) {
      case 'low': return 'منخفض';
      case 'medium': return 'متوسط';
      case 'high': return 'مرتفع';
      default: return 'غير محدد';
    }
  };

  return (
    <Card className="p-6 shadow-soft">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-accent/10">
          <Calculator className="h-6 w-6 text-accent" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{t('creditCalc.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('creditCalc.subtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="customer">{t('creditCalc.customer')}</Label>
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder={t('creditCalc.selectCustomer')} />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="monthlyIncome">{t('creditCalc.monthlyIncome')}</Label>
            <Input
              id="monthlyIncome"
              type="number"
              placeholder={t('creditCalc.monthlyIncomeExample')}
              value={formData.monthlyIncome}
              onChange={(e) => setFormData(prev => ({ ...prev, monthlyIncome: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="currentDebt">{t('creditCalc.currentDebt')}</Label>
            <Input
              id="currentDebt"
              type="number"
              placeholder={t('creditCalc.currentDebtExample')}
              value={formData.currentDebt}
              onChange={(e) => setFormData(prev => ({ ...prev, currentDebt: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="creditScore">{t('creditCalc.creditScore')}</Label>
            <Input
              id="creditScore"
              type="number"
              placeholder={t('creditCalc.creditScoreExample')}
              min="300"
              max="850"
              value={formData.creditScore}
              onChange={(e) => setFormData(prev => ({ ...prev, creditScore: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="paymentHistory">{t('creditCalc.paymentHistory')}</Label>
            <Input
              id="paymentHistory"
              type="number"
              placeholder={t('creditCalc.paymentHistoryExample')}
              min="0"
              max="100"
              value={formData.paymentHistory}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentHistory: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="yearsWithStore">{t('creditCalc.yearsWithStore')}</Label>
            <Input
              id="yearsWithStore"
              type="number"
              placeholder={t('creditCalc.yearsExample')}
              min="0"
              value={formData.yearsWithStore}
              onChange={(e) => setFormData(prev => ({ ...prev, yearsWithStore: e.target.value }))}
            />
          </div>

          <Button 
            onClick={calculateCreditLimit}
            className="w-full gradient-accent text-accent-foreground"
            disabled={!formData.monthlyIncome || !formData.creditScore || !formData.paymentHistory}
          >
            {t('creditCalc.calculate')}
          </Button>
        </div>

        {result && (
          <div className="space-y-6">
            <div className="text-center p-6 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border">
              <h3 className="text-lg font-semibold mb-2">{t('creditCalc.suggestedLimit')}</h3>
              <p className="text-3xl font-bold text-primary mb-2">
                {result.creditLimit.toLocaleString('ar-EG')} ج.م
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm">{t('creditCalc.riskLevel')}:</span>
                <Badge className={getRiskColor(result.riskLevel)}>
                  {getRiskText(result.riskLevel)}
                </Badge>
                {result.riskLevel === 'low' && <CheckCircle className="h-4 w-4 text-success" />}
                {result.riskLevel === 'high' && <AlertTriangle className="h-4 w-4 text-destructive" />}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {t('creditCalc.factors')}
              </h4>
              <div className="space-y-3">
                {result.factors.map((factor, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{factor.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(factor.impact)}%
                      </span>
                    </div>
                    <Progress value={factor.impact} className="h-2 mb-1" />
                    <p className="text-xs text-muted-foreground">{factor.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={saveCalculation}
              className="w-full gradient-primary text-primary-foreground"
              disabled={saving}
            >
              {saving ? (
                <>{t('creditCalc.saving')}</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t('creditCalc.saveResult')}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}