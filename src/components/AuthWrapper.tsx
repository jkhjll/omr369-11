import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useToast } from '@/hooks/use-toast';
interface AuthWrapperProps {
  children: React.ReactNode;
}
export function AuthWrapper({
  children
}: AuthWrapperProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const {
    toast
  } = useToast();
  useEffect(() => {
    // جلب المستخدم الحالي
    const getUser = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };
    getUser();

    // الاستماع لتغييرات حالة المصادقة
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "مرحباً بك في نظام سلوك العملاء"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setAuthLoading(false);
    }
  };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      if (error) {
        toast({
          title: "خطأ في إنشاء الحساب",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "تم إنشاء الحساب",
          description: "يرجى فحص بريدك الإلكتروني لتأكيد الحساب"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setAuthLoading(false);
    }
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-surface">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground font-cairo">جاري التحقق من حالة تسجيل الدخول...</p>
        </div>
      </div>;
  }
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-surface p-4">
        <div className="absolute top-4 left-4">
          <ThemeToggle />
        </div>
        
        <Card className="w-full max-w-md shadow-strong bg-card/95 backdrop-blur-sm border-border/50">
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="mb-2 font-cairo text-teal-500 font-extrabold text-4xl">نظام سلوك العملاء</h1>
              <p className="text-muted-foreground font-cairo">
                {isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول للوصول إلى لوحة التحكم'}
              </p>
            </div>

            <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-cairo">
                  البريد الإلكتروني
                </Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="أدخل بريدك الإلكتروني" className="pr-10 font-cairo" required disabled={authLoading} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-cairo">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="أدخل كلمة المرور" className="pr-10 pl-10 font-cairo" required disabled={authLoading} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" disabled={authLoading}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {!isSignUp && <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox id="remember" checked={rememberMe} onCheckedChange={checked => setRememberMe(checked === true)} disabled={authLoading} />
                  <Label htmlFor="remember" className="text-sm text-muted-foreground font-cairo cursor-pointer">
                    تذكرني
                  </Label>
                </div>}

              <Button type="submit" className="w-full gradient-primary text-primary-foreground font-cairo hover:opacity-90 transition-opacity" disabled={authLoading}>
                {authLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                {isSignUp ? 'إنشاء حساب' : 'تسجيل الدخول'}
              </Button>
            </form>


            <div className="mt-6 text-center">
              <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-primary hover:text-primary-light transition-colors font-cairo" disabled={authLoading}>
                {isSignUp ? 'لديك حساب بالفعل؟ سجل دخولك' : 'ليس لديك حساب؟ أنشئ حساباً جديداً'}
              </button>
            </div>
          </div>
        </Card>
      </div>;
  }
  return <>{children}</>;
}