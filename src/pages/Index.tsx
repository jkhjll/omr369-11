import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CustomerCard } from "@/components/CustomerCard";
import { CreditLimitCalculator } from "@/components/CreditLimitCalculator";
import { PaymentAnalysis } from "@/components/PaymentAnalysis";
import { DataImport } from "@/components/DataImport";
import { AddCustomer } from "@/components/AddCustomer";
import { ReportsSection } from "@/components/ReportsSection";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Download, Users, Loader as Loader2 } from "lucide-react";
import { useCustomers, CustomerData } from "@/hooks/useCustomers";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>("");
  const { 
    customers, 
    loading, 
    error, 
    addCustomer, 
    addMultipleCustomers,
    updateCustomer,
    deleteCustomer 
  } = useCustomers();

  const filteredCustomers = customers.filter(customer =>
    customer.name.includes(searchTerm) || 
    customer.phone.includes(searchTerm) || 
    customer.customerCode.includes(searchTerm)
  );

  const handleViewCustomerDetails = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    setSelectedCustomer(customerId);
    setSelectedCustomerName(customer?.name || "");
  };

  const handleDataImported = async (importedData: (CustomerData & { id: string })[]) => {
    const customersData = importedData.map(({ id, ...customer }) => customer);
    await addMultipleCustomers(customersData);
  };

  const handleCustomerAdded = async (newCustomer: CustomerData & { id: string }) => {
    const { id, ...customerData } = newCustomer;
    await addCustomer(customerData);
  };

  const handleExportData = () => {
    if (customers.length === 0) {
      return;
    }

    const csvContent = [
      // Headers
      'customerCode,name,phone,creditScore,paymentCommitment,hagglingLevel,purchaseWillingness,lastPayment,totalDebt,status',
      // Data rows
      ...customers.map(customer => 
        `"${customer.customerCode}","${customer.name}","${customer.phone}",${customer.creditScore},${customer.paymentCommitment},${customer.hagglingLevel},${customer.purchaseWillingness},"${customer.lastPayment}",${customer.totalDebt},"${customer.status}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `بيانات_العملاء_${new Date().toLocaleDateString('ar-EG')}.csv`;
    link.click();
  };

  return (
    <DashboardLayout>
      <Tabs defaultValue="customers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('nav.customers')}
          </TabsTrigger>
          <TabsTrigger value="credit-calculator">{t('nav.creditCalculator')}</TabsTrigger>
          <TabsTrigger value="payment-analysis">{t('nav.paymentAnalysis')}</TabsTrigger>
          <TabsTrigger value="reports">{t('nav.reports')}</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-6">
          {/* Search and Filters */}
          <Card className="p-6 shadow-soft">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('search.placeholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <AddCustomer onCustomerAdded={handleCustomerAdded} />
                <DataImport onDataImported={handleDataImported} />
                <Button 
                  onClick={handleExportData}
                  disabled={customers.length === 0}
                  className="gradient-secondary text-secondary-foreground"
                >
                  <Download className="h-4 w-4 ml-2" />
                  {t('btn.exportData')}
                </Button>
              </div>
            </div>
          </Card>

          {/* Customer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <Card className="col-span-full p-12 text-center shadow-soft">
                <div className="max-w-md mx-auto">
                  <Loader2 className="h-16 w-16 mx-auto text-primary mb-4 animate-spin" />
                  <h3 className="text-lg font-semibold mb-2">{t('msg.loading')}</h3>
                  <p className="text-muted-foreground">
                    {t('msg.loadingCustomers') || 'يتم جلب بيانات العملاء من قاعدة البيانات'}
                  </p>
                </div>
              </Card>
            ) : error ? (
              <Card className="col-span-full p-12 text-center shadow-soft">
                <div className="max-w-md mx-auto">
                  <Users className="h-16 w-16 mx-auto text-destructive mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('msg.error')}</h3>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button onClick={() => window.location.reload()} variant="outline">
                    {t('btn.retry') || 'إعادة المحاولة'}
                  </Button>
                </div>
              </Card>
            ) : filteredCustomers.length === 0 ? (
              <Card className="col-span-full p-12 text-center shadow-soft">
                <div className="max-w-md mx-auto">
                  <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {customers.length === 0 ? 'لا توجد بيانات عملاء' : 'لا توجد نتائج للبحث'}
                  </h3>
                  <p className="text-muted-foreground">
                    {customers.length === 0 
                      ? t('msg.noCustomersDesc') || 'ابدأ بإضافة بيانات العملاء لتحليل سلوكهم الشرائي والائتماني'
                      : t('msg.noSearchResultsDesc') || 'جرب البحث بمصطلحات أخرى أو امسح مربع البحث لعرض جميع العملاء'
                    }
                  </p>
                </div>
              </Card>
            ) : (
              filteredCustomers.map((customer) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  onViewDetails={handleViewCustomerDetails}
                  onDelete={deleteCustomer}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="credit-calculator">
          <CreditLimitCalculator />
        </TabsContent>

        <TabsContent value="payment-analysis">
          {selectedCustomer && selectedCustomerName ? (
            <PaymentAnalysis 
              customerId={selectedCustomer} 
              customerName={selectedCustomerName}
            />
          ) : (
            <Card className="p-12 text-center shadow-soft">
              <div className="max-w-md mx-auto">
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">اختر عميلاً لعرض تحليل الدفع</h3>
                <p className="text-muted-foreground">
                  قم بإضافة بيانات العملاء أولاً ثم اختر عميلاً من قائمة العملاء لعرض تحليل مفصل لتاريخ دفعاته
                </p>
                {customers.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">أو اختر من العملاء المتاحين:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {customers.slice(0, 5).map((customer) => (
                        <Button
                          key={customer.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewCustomerDetails(customer.id)}
                        >
                          {customer.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reports">
          <ReportsSection />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Index;