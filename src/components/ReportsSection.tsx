import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Plus, ChartBar as BarChart3, TrendingUp, Users, CreditCard, Calendar, Trash2, Eye } from "lucide-react";
import { useReports, Report } from "@/hooks/useReports";
import { useCustomers } from "@/hooks/useCustomers";
import { usePaymentRecords } from "@/hooks/usePaymentRecords";
import { useToast } from "@/hooks/use-toast";

export function ReportsSection() {
  const { reports, loading, addReport, deleteReport, generateCustomerAnalysisReport, generatePaymentAnalysisReport } = useReports();
  const { customers } = useCustomers();
  const { paymentRecords } = usePaymentRecords();
  const { toast } = useToast();
  
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [newReport, setNewReport] = useState({
    title: '',
    description: '',
    reportType: 'custom' as Report['reportType']
  });

  const handleCreateReport = async () => {
    if (!newReport.title.trim()) {
      toast({
        title: "خطأ",
        description: "يجب إدخال عنوان التقرير",
        variant: "destructive"
      });
      return;
    }

    const success = await addReport(newReport);
    if (success) {
      setIsCreatingReport(false);
      setNewReport({
        title: '',
        description: '',
        reportType: 'custom'
      });
    }
  };

  const handleGenerateCustomerReport = async () => {
    if (customers.length === 0) {
      toast({
        title: "لا توجد بيانات",
        description: "لا توجد بيانات عملاء لإنشاء التقرير",
        variant: "destructive"
      });
      return;
    }

    await generateCustomerAnalysisReport(customers);
  };

  const handleGeneratePaymentReport = async () => {
    if (paymentRecords.length === 0) {
      toast({
        title: "لا توجد بيانات",
        description: "لا توجد سجلات دفع لإنشاء التقرير",
        variant: "destructive"
      });
      return;
    }

    await generatePaymentAnalysisReport(paymentRecords);
  };

  const exportReport = (report: Report) => {
    const reportContent = {
      title: report.title,
      description: report.description,
      type: report.reportType,
      data: report.data,
      generatedAt: report.createdAt,
    };

    const blob = new Blob([JSON.stringify(reportContent, null, 2)], { 
      type: 'application/json;charset=utf-8;' 
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${report.title.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('ar-EG')}.json`;
    link.click();
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'customer_analysis': return 'تحليل العملاء';
      case 'payment_analysis': return 'تحليل الدفع';
      case 'credit_analysis': return 'تحليل الائتمان';
      case 'custom': return 'مخصص';
      default: return type;
    }
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'customer_analysis': return 'bg-primary text-primary-foreground';
      case 'payment_analysis': return 'bg-secondary text-secondary-foreground';
      case 'credit_analysis': return 'bg-accent text-accent-foreground';
      case 'custom': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Card className="p-12 text-center shadow-soft">
        <div className="max-w-md mx-auto">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4 animate-pulse" />
          <h3 className="text-lg font-semibold mb-2">جاري تحميل التقارير...</h3>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <Card className="p-6 shadow-soft">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              التقارير والتحليلات
            </h2>
            <p className="text-muted-foreground">إنشاء وإدارة التقارير التحليلية</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleGenerateCustomerReport} className="gradient-primary text-primary-foreground">
              <Users className="h-4 w-4 ml-2" />
              تقرير العملاء
            </Button>
            <Button onClick={handleGeneratePaymentReport} className="gradient-secondary text-secondary-foreground">
              <CreditCard className="h-4 w-4 ml-2" />
              تقرير الدفع
            </Button>
            <Dialog open={isCreatingReport} onOpenChange={setIsCreatingReport}>
              <DialogTrigger asChild>
                <Button className="gradient-accent text-accent-foreground">
                  <Plus className="h-4 w-4 ml-2" />
                  تقرير مخصص
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إنشاء تقرير مخصص</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">عنوان التقرير</Label>
                    <Input
                      id="title"
                      value={newReport.title}
                      onChange={(e) => setNewReport(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="أدخل عنوان التقرير"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">الوصف</Label>
                    <Input
                      id="description"
                      value={newReport.description}
                      onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="وصف مختصر للتقرير"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reportType">نوع التقرير</Label>
                    <Select value={newReport.reportType} onValueChange={(value) => setNewReport(prev => ({ ...prev, reportType: value as Report['reportType'] }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">مخصص</SelectItem>
                        <SelectItem value="customer_analysis">تحليل العملاء</SelectItem>
                        <SelectItem value="payment_analysis">تحليل الدفع</SelectItem>
                        <SelectItem value="credit_analysis">تحليل الائتمان</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreatingReport(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={handleCreateReport}>
                      إنشاء التقرير
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.length === 0 ? (
          <Card className="col-span-full p-12 text-center shadow-soft">
            <div className="max-w-md mx-auto">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد تقارير</h3>
              <p className="text-muted-foreground mb-6">
                ابدأ بإنشاء تقارير تحليلية لبيانات العملاء والدفعات
              </p>
              <Button onClick={() => setIsCreatingReport(true)} className="gradient-primary text-primary-foreground">
                <Plus className="h-4 w-4 ml-2" />
                إنشاء أول تقرير
              </Button>
            </div>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id} className="p-6 shadow-soft hover:shadow-medium transition-smooth">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getReportTypeColor(report.reportType)}>
                      {getReportTypeLabel(report.reportType)}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{report.title}</h3>
                  {report.description && (
                    <p className="text-sm text-muted-foreground mb-3">{report.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{report.createdAt ? new Date(report.createdAt).toLocaleDateString('ar-EG') : ''}</span>
                </div>
              </div>

              {/* Report Data Preview */}
              {report.data && (
                <div className="bg-muted/50 rounded-lg p-3 mb-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {report.reportType === 'customer_analysis' && report.data.totalCustomers && (
                      <>
                        <div>
                          <span className="text-muted-foreground">العملاء:</span>
                          <span className="font-medium mr-1">{report.data.totalCustomers}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">متوسط الائتمان:</span>
                          <span className="font-medium mr-1">{Math.round(report.data.averageCreditScore || 0)}</span>
                        </div>
                      </>
                    )}
                    {report.reportType === 'payment_analysis' && report.data.totalPayments && (
                      <>
                        <div>
                          <span className="text-muted-foreground">الدفعات:</span>
                          <span className="font-medium mr-1">{report.data.totalPayments}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">في الموعد:</span>
                          <span className="font-medium mr-1">{report.data.paidOnTime}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedReport(report)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 ml-2" />
                  عرض
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportReport(report)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteReport(report.id)}
                  className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Report Details Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedReport?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-6">
              <div>
                <Badge className={getReportTypeColor(selectedReport.reportType)}>
                  {getReportTypeLabel(selectedReport.reportType)}
                </Badge>
                {selectedReport.description && (
                  <p className="text-muted-foreground mt-2">{selectedReport.description}</p>
                )}
              </div>

              {selectedReport.data && (
                <div className="space-y-4">
                  <h4 className="font-semibold">بيانات التقرير</h4>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <pre className="text-sm overflow-x-auto">
                      {JSON.stringify(selectedReport.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedReport(null)}>
                  إغلاق
                </Button>
                <Button onClick={() => exportReport(selectedReport)}>
                  <Download className="h-4 w-4 ml-2" />
                  تصدير
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}