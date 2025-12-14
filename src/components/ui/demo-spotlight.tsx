import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Layers, ShieldCheck, Zap } from "lucide-react";

export default function DemoSpotlight() {
  return (
    <div className="w-full flex items-center justify-center bg-background p-4 sm:p-10 py-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 max-w-5xl w-full">
        
        <SpotlightCard className="p-6 h-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-card border border-border">
            <Layers className="text-primary h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">تجربة مستخدم سلسة</h3>
            <p className="text-sm text-muted-foreground">
              تفاعلات سلسة تستجيب للماوس ترفع تجربة المستخدم إلى المستوى التالي.
            </p>
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-6 h-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100" spotlightColor="rgba(14, 165, 233, 0.25)">
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-sky-900/20 border border-sky-800/50">
            <ShieldCheck className="text-sky-400 h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">آمن بالتصميم</h3>
            <p className="text-sm text-muted-foreground">
              مبني بمعايير أمان حديثة، لضمان حماية بياناتك بتشفير من طرف إلى طرف.
            </p>
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-6 h-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200" spotlightColor="rgba(168, 85, 247, 0.25)">
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-purple-900/20 border border-purple-800/50">
            <Zap className="text-purple-400 h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">سريع كالبرق</h3>
            <p className="text-sm text-muted-foreground">
              محسّن للأداء. استورد المكون وابدأ البناء بدون تكوين معقد.
            </p>
          </div>
        </SpotlightCard>

      </div>
    </div>
  );
}