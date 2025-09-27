import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { User, CreditCard, TrendingUp, MessageSquare, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/LanguageContext";

interface Customer {
  id: string;
  customerCode: string;
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
  onDelete?: (customerId: string) => void;
}

export function CustomerCard({ customer, onViewDetails, onDelete }: CustomerCardProps) {
  const { t } = useLanguage();
  
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
      case 'excellent': return t('status.excellent');
      case 'good': return t('status.good');
      case 'fair': return t('status.fair');
      case 'poor': return t('status.poor');
      default: return t('status.unknown');
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
            <p className="text-xs text-muted-foreground">{customer.customerCode}</p>
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
            <span className="text-sm">{t('field.creditScore')}</span>
          </div>
          <div className="text-left">
            <span className="font-bold text-lg">{customer.creditScore}</span>
            <span className="text-sm text-muted-foreground">/850</span>
          </div>
        </div>

        {/* Payment Commitment */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">{t('field.paymentCommitment')}</span>
            <span className="text-sm font-medium">{customer.paymentCommitment}%</span>
          </div>
          <Progress value={customer.paymentCommitment} className="h-2" />
        </div>

        {/* Haggling Level */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-accent" />
              <span className="text-sm">{t('field.hagglingLevel')}</span>
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
              <span className="text-sm">{t('field.purchaseWillingness')}</span>
            </div>
            <span className="text-sm font-medium">{customer.purchaseWillingness}/10</span>
          </div>
          <Progress value={customer.purchaseWillingness * 10} className="h-2" />
        </div>

        {/* Financial Info */}
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">{t('field.lastPayment')}</span>
            <span className="text-sm">{customer.lastPayment}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t('field.totalDebt')}</span>
            <span className="text-sm font-bold text-destructive">
              {customer.totalDebt.toLocaleString('ar-EG')} ج.م
            </span>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button 
            onClick={() => onViewDetails(customer.id)}
            className="flex-1 gradient-primary text-primary-foreground"
          >
            {t('btn.viewDetails')}
          </Button>
          
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('dialog.confirmDelete') || 'تأكيد الحذف'}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('dialog.confirmDeleteDesc').replace('{name}', customer.name)}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('btn.cancel')}</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => onDelete(customer.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t('btn.delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </Card>
  );
}