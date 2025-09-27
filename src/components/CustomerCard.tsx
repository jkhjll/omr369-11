import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { User, CreditCard, TrendingUp, MessageSquare } from "lucide-react";

interface Customer {
  id: string;
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

interface CustomerCardProps {
  customer: Customer;
  onViewDetails: (customerId: string) => void;
}

export function CustomerCard({ customer, onViewDetails }: CustomerCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-success text-success-foreground';
      case 'good': return 'bg-secondary text-secondary-foreground';
      case 'fair': return 'bg-warning text-warning-foreground';
      case 'poor': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'excellent': return 'ممتاز';
      case 'good': return 'جيد';
      case 'fair': return 'مقبول';
      case 'poor': return 'ضعيف';
      default: return 'غير محدد';
    }
  };

  return (
    <Card className="p-6 shadow-soft hover:shadow-medium transition-smooth">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{customer.name}</h3>
            <p className="text-sm text-muted-foreground">{customer.phone}</p>
          </div>
        </div>
        <Badge className={getStatusColor(customer.status)}>
          {getStatusText(customer.status)}
        </Badge>
      </div>

      <div className="space-y-4">
        {/* Credit Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <span className="text-sm">الدرجة الائتمانية</span>
          </div>
          <div className="text-left">
            <span className="font-bold text-lg">{customer.creditScore}</span>
            <span className="text-sm text-muted-foreground">/850</span>
          </div>
        </div>

        {/* Payment Commitment */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">الالتزام بالدفع</span>
            <span className="text-sm font-medium">{customer.paymentCommitment}%</span>
          </div>
          <Progress value={customer.paymentCommitment} className="h-2" />
        </div>

        {/* Haggling Level */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-accent" />
              <span className="text-sm">مستوى المساومة</span>
            </div>
            <span className="text-sm font-medium">{customer.hagglingLevel}/10</span>
          </div>
          <Progress value={customer.hagglingLevel * 10} className="h-2" />
        </div>

        {/* Purchase Willingness */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-secondary" />
              <span className="text-sm">الرغبة في الشراء</span>
            </div>
            <span className="text-sm font-medium">{customer.purchaseWillingness}/10</span>
          </div>
          <Progress value={customer.purchaseWillingness * 10} className="h-2" />
        </div>

        {/* Financial Info */}
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">آخر دفعة</span>
            <span className="text-sm">{customer.lastPayment}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">إجمالي الدين</span>
            <span className="text-sm font-bold text-destructive">
              {customer.totalDebt.toLocaleString('ar-EG')} ج.م
            </span>
          </div>
        </div>

        <Button 
          onClick={() => onViewDetails(customer.id)}
          className="w-full mt-4 gradient-primary text-primary-foreground"
        >
          عرض التفاصيل
        </Button>
      </div>
    </Card>
  );
}