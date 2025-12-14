import { Scene } from "@/components/ui/hero-section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <div className="min-h-svh w-screen bg-gradient-to-br from-background to-background/90 text-foreground flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-6xl space-y-0 relative z-10">
        <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8 mb-8 sm:mb-12">
          <Badge variant="secondary" className="backdrop-blur-sm bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 px-4 py-2 rounded-full animate-in fade-in duration-500">
            ✨ أدوات الجيل القادم
          </Badge>
          
          <div className="space-y-4 sm:space-y-6 flex items-center justify-center flex-col animate-in slide-in-from-bottom-3 duration-700">
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-semibold tracking-tight max-w-3xl px-4">
              اكتشف البساطة والقوة في مكان واحد
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl px-4">
              مصمم مع التركيز على الجماليات والأداء. استمتع بمعالجة فائقة السرعة وأمان متقدم وتصميم بديهي.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
              <Button className="text-sm px-8 py-3 rounded-xl bg-primary text-primary-foreground border border-primary/10 shadow-none hover:bg-primary/90 transition-all">
                ابدأ الآن
              </Button>
              <Button variant="outline" className="text-sm px-8 py-3 rounded-xl bg-transparent text-foreground border border-border shadow-none hover:bg-accent transition-all">
                اعرف المزيد
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-5xl mx-auto animate-in fade-in duration-700 delay-300">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="backdrop-blur-sm bg-card/50 border border-border rounded-xl p-4 md:p-6 h-40 md:h-48 flex flex-col justify-start items-start space-y-2 md:space-y-3 hover:bg-card/70 transition-all duration-300"
            >
              <feature.icon size={18} className="text-primary md:w-5 md:h-5" />
              <h3 className="text-sm md:text-base font-medium">{feature.title}</h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
      <div className='absolute inset-0'>
        <Scene />
      </div>
    </div>
  );
};

export { DemoOne };