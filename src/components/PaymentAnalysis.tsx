import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, Clock, TrendingDown, TrendingUp, AlertCircle } from "lucide-react";

interface PaymentRecord {
  id: string;
  dueDate: string;
  paidDate: string | null;
  amount: number;
  status: 'paid' | 'late' | 'pending' | 'missed';
  daysLate?: number;
}

interface PaymentAnalysisProps {
  customerId: string;
  customerName: string;
  paymentHistory: PaymentRecord[];
}

export function PaymentAnalysis({ customerId, customerName, paymentHistory }: PaymentAnalysisProps) {
  // Calculate metrics
  const totalPayments = paymentHistory.length;
  const paidOnTime = paymentHistory.filter(p => p.status === 'paid' && !p.daysLate).length;
  const latePayments = paymentHistory.filter(p => p.status === 'late' || (p.daysLate && p.daysLate > 0)).length;
  const missedPayments = paymentHistory.filter(p => p.status === 'missed').length;
  const pendingPayments = paymentHistory.filter(p => p.status === 'pending').length;

  const onTimeRate = totalPayments > 0 ? (paidOnTime / totalPayments) * 100 : 0;
  const lateRate = totalPayments > 0 ? (latePayments / totalPayments) * 100 : 0;
  const missedRate = totalPayments > 0 ? (missedPayments / totalPayments) * 100 : 0;

  // Average days late
  const lateDays = paymentHistory
    .filter(p => p.daysLate && p.daysLate > 0)
    .map(p => p.daysLate || 0);
  const avgDaysLate = lateDays.length > 0 ? lateDays.reduce((a, b) => a + b, 0) / lateDays.length : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-success text-success-foreground';
      case 'late': return 'bg-warning text-warning-foreground';
      case 'pending': return 'bg-secondary text-secondary-foreground';
      case 'missed': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'مدفوع';
      case 'late': return 'متأخر';
      case 'pending': return 'معلق';
      case 'missed': return 'فائت';
      default: return 'غير محدد';
    }
  };

  const getCommitmentLevel = (rate: number) => {
    if (rate >= 95) return { text: 'ممتاز', color: 'text-success' };
    if (rate >= 85) return { text: 'جيد جداً', color: 'text-secondary' };
    if (rate >= 75) return { text: 'جيد', color: 'text-warning' };
    if (rate >= 60) return { text: 'مقبول', color: 'text-warning' };
    return { text: 'ضعيف', color: 'text-destructive' };
  };

  const commitmentLevel = getCommitmentLevel(onTimeRate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              تحليل الالتزام بالدفع
            </h2>
            <p className="text-muted-foreground">العميل: {customerName}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">مستوى الالتزام</p>
            <p className={`text-2xl font-bold ${commitmentLevel.color}`}>
              {commitmentLevel.text}
            </p>
            <p className="text-sm">({onTimeRate.toFixed(1)}%)</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-success/10">
            <p className="text-2xl font-bold text-success">{paidOnTime}</p>
            <p className="text-sm text-muted-foreground">دفعات في الموعد</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-warning/10">
            <p className="text-2xl font-bold text-warning">{latePayments}</p>
            <p className="text-sm text-muted-foreground">دفعات متأخرة</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-destructive/10">
            <p className="text-2xl font-bold text-destructive">{missedPayments}</p>
            <p className="text-sm text-muted-foreground">دفعات فائتة</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-secondary/10">
            <p className="text-2xl font-bold text-secondary">{pendingPayments}</p>
            <p className="text-sm text-muted-foreground">دفعات معلقة</p>
          </div>
        </div>
      </Card>

      {/* Payment Patterns */}
      <Card className="p-6 shadow-soft">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          أنماط الدفع
        </h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">نسبة الدفع في الموعد</span>
              <span className="text-sm text-success font-bold">{onTimeRate.toFixed(1)}%</span>
            </div>
            <Progress value={onTimeRate} className="h-3" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">نسبة التأخير</span>
              <span className="text-sm text-warning font-bold">{lateRate.toFixed(1)}%</span>
            </div>
            <Progress value={lateRate} className="h-3" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">نسبة الدفعات الفائتة</span>
              <span className="text-sm text-destructive font-bold">{missedRate.toFixed(1)}%</span>
            </div>
            <Progress value={missedRate} className="h-3" />
          </div>

          {avgDaysLate > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium">متوسط أيام التأخير</span>
              </div>
              <span className="font-bold text-warning">{avgDaysLate.toFixed(1)} يوم</span>
            </div>
          )}
        </div>
      </Card>

      {/* Recent Payment History */}
      <Card className="p-6 shadow-soft">
        <h3 className="text-lg font-semibold mb-4">تاريخ الدفعات الأخيرة</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {paymentHistory.slice(0, 10).map((payment) => (
            <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-medium">{payment.amount.toLocaleString('ar-EG')} ج.م</p>
                  <p className="text-sm text-muted-foreground">
                    موعد الاستحقاق: {new Date(payment.dueDate).toLocaleDateString('ar-EG')}
                  </p>
                  {payment.paidDate && (
                    <p className="text-xs text-muted-foreground">
                      تاريخ الدفع: {new Date(payment.paidDate).toLocaleDateString('ar-EG')}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {payment.daysLate && payment.daysLate > 0 && (
                  <span className="text-xs text-warning flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {payment.daysLate} يوم تأخير
                  </span>
                )}
                <Badge className={getStatusColor(payment.status)}>
                  {getStatusText(payment.status)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}