import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export function LiveClock() {
  const { language } = useLanguage();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <p className="text-sm font-medium text-muted-foreground">
      {formatTime(time)}
    </p>
  );
}