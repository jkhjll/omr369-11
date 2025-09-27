import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, CreditCard } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LiveClock } from "@/components/LiveClock";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const stats = [
    {
      title: "إجمالي العملاء",
      value: "0",
      change: "--",
      icon: Users,
      trend: "neutral"
    },
    {
      title: "متوسط الدرجة الائتمانية",
      value: "--",
      change: "--",
      icon: CreditCard,
      trend: "neutral"
    },
    {
      title: "معدل الالتزام بالدفع",
      value: "--",
      change: "--",
      icon: TrendingUp,
      trend: "neutral"
    },
    {
      title: "مؤشر سلوك الشراء",
      value: "--",
      change: "--",
      icon: BarChart3,
      trend: "neutral"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm shadow-soft">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
                نظام تحليل سلوك العملاء
              </h1>
              <p className="text-muted-foreground mt-1">
                تحليل متطور لسلوك العملاء والائتمان
              </p>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="text-left">
                <p className="text-sm text-muted-foreground">آخر تحديث</p>
                <p className="font-medium">{new Date().toLocaleDateString('ar-EG')}</p>
                <LiveClock />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6 shadow-soft hover:shadow-medium transition-smooth">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground font-medium">{stat.change}</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        {children}
      </div>
    </div>
  );
}