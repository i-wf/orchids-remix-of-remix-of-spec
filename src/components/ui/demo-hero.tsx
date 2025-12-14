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
    <div className="min-h-svh w-screen bg-gradient-to-br from-[#000] to-[#1A2428] text-white flex flex-col items-center justify-center p-8 relative">
      <div className="w-full max-w-6xl space-y-12 relative z-10">
        <div className="flex flex-col items-center text-center space-y-8">
          <Badge variant="secondary" className="backdrop-blur-sm bg-white/10 border border-white/20 text-white hover:bg-white/20 px-4 py-2 rounded-full">
            ✨ أدوات الجيل القادم
          </Badge>
          
          <div className="space-y-6 flex items-center justify-center flex-col ">
            <h1 className="text-3xl md:text-6xl font-semibold tracking-tight max-w-3xl">
              اكتشف البساطة والقوة في مكان واحد
            </h1>
            <p className="text-lg text-neutral-300 max-w-2xl">
              مصمم مع التركيز على الجماليات والأداء. استمتع بمعالجة فائقة السرعة وأمان متقدم وتصميم بديهي.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 h-40 md:h-48 flex flex-col justify-start items-start space-y-2 md:space-y-3 hover:bg-white/10 hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-white/30"
            >
              <feature.icon size={18} className="text-white/80 md:w-5 md:h-5" />
              <h3 className="text-sm md:text-base font-medium">{feature.title}</h3>
              <p className="text-xs md:text-sm text-neutral-400">{feature.description}</p>
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