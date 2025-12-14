import { Button } from "@/components/ui/button";
import { Cpu, ShieldCheck, Layers, Zap } from "lucide-react";

const features = [
  {
    icon: Cpu,
    title: "الأداء",
    description: "معالجة فائقة السرعة للبيانات في كل موقف.",
  },
  {
    icon: ShieldCheck,
    title: "الأمان",
    description: "حماية متقدمة لراحة بال كاملة.",
  },
  {
    icon: Layers,
    title: "التوافق",
    description: "تكامل سهل مع البنية الموجودة.",
  },
  {
    icon: Zap,
    title: "الاستجابة",
    description: "رد فوري على كل أمر.",
  },
];

const DemoOne = () => {
  return (
    <div className="w-screen bg-gradient-to-br from-background to-background/90 text-foreground flex flex-col items-center justify-center p-4 sm:p-8 py-12">
      <div className="w-full max-w-6xl space-y-0 relative z-10">
        <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8 mb-6 animate-in slide-in-from-bottom-3 duration-700">
          <div className="mb-2 bg-primary/10 text-primary backdrop-blur-md border border-primary/20 uppercase tracking-wider font-medium flex items-center gap-2 px-4 py-1.5 rounded-full mx-auto">
            <span className="text-[10px] font-light tracking-[0.18em] text-primary/80">
              ✨ أدوات الجيل القادم
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-semibold tracking-tight max-w-3xl px-4">
            اكتشف البساطة والقوة في مكان واحد
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl px-4">
            مصمم مع التركيز على الجماليات والأداء. استمتع بمعالجة فائقة السرعة وأمان متقدم وتصميم بديهي.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-5xl mx-auto animate-in fade-in duration-700 delay-300">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="backdrop-blur-sm bg-card/50 border border-border rounded-xl p-4 md:p-6 h-40 md:h-48 flex flex-col justify-start items-start space-y-2 md:space-y-3 hover:bg-card/70 hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-primary/30"
              style={{
                animationDelay: `${idx * 100}ms`
              }}
            >
              <feature.icon size={18} className="text-primary md:w-5 md:h-5" />
              <h3 className="text-sm md:text-base font-medium">{feature.title}</h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { DemoOne };