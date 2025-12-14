"use client";

import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Sparkles, Brain, MessageCircle, Video, FileText, Award } from "lucide-react";

export function FeaturesSection() {
  return (
    <div className="w-full flex items-center justify-center bg-gradient-to-br from-[#000] to-[#1A2428] p-4 sm:p-10 py-16">
      <div className="max-w-7xl w-full">
        <div className="text-center mb-12 animate-in fade-in duration-700">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
            لماذا تختار منصتنا؟
          </h2>
          <p className="text-neutral-400 text-lg">
            تجربة تعليمية متكاملة بأحدث التقنيات
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          
          <SpotlightCard 
            className="p-6 h-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700" 
            spotlightColor="rgba(14, 165, 233, 0.25)"
          >
            <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-blue-900/20 border border-blue-800/50">
              <Brain className="text-blue-400 h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">ذكاء اصطناعي متقدم</h3>
              <p className="text-sm text-neutral-400">
                مساعد ذكي يجيب على أسئلتك ويشرح المفاهيم الصعبة بطريقة سهلة ومبسطة.
              </p>
            </div>
          </SpotlightCard>

          <SpotlightCard 
            className="p-6 h-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100" 
            spotlightColor="rgba(59, 130, 246, 0.25)"
          >
            <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-blue-800/20 border border-blue-700/50">
              <Video className="text-blue-300 h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">دروس فيديو تفاعلية</h3>
              <p className="text-sm text-neutral-400">
                مكتبة شاملة من الدروس المصورة بجودة عالية مع شروحات واضحة ومفصلة.
              </p>
            </div>
          </SpotlightCard>

          <SpotlightCard 
            className="p-6 h-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200" 
            spotlightColor="rgba(96, 165, 250, 0.25)"
          >
            <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-blue-700/20 border border-blue-600/50">
              <FileText className="text-blue-200 h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">ملخصات ذكية</h3>
              <p className="text-sm text-neutral-400">
                الذكاء الاصطناعي يلخص الدروس في نقاط مركزة لمراجعة سريعة وفعالة.
              </p>
            </div>
          </SpotlightCard>

          <SpotlightCard 
            className="p-6 h-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300" 
            spotlightColor="rgba(14, 165, 233, 0.25)"
          >
            <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-blue-900/20 border border-blue-800/50">
              <MessageCircle className="text-blue-400 h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">دعم فوري</h3>
              <p className="text-sm text-neutral-400">
                تواصل مع المدرسين مباشرة واحصل على إجابات لأسئلتك في أي وقت.
              </p>
            </div>
          </SpotlightCard>

          <SpotlightCard 
            className="p-6 h-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400" 
            spotlightColor="rgba(59, 130, 246, 0.25)"
          >
            <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-blue-800/20 border border-blue-700/50">
              <Award className="text-blue-300 h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">امتحانات ومتابعة</h3>
              <p className="text-sm text-neutral-400">
                اختبر نفسك وتابع تقدمك مع تقارير مفصلة عن أدائك الدراسي.
              </p>
            </div>
          </SpotlightCard>

          <SpotlightCard 
            className="p-6 h-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500" 
            spotlightColor="rgba(96, 165, 250, 0.25)"
          >
            <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-blue-700/20 border border-blue-600/50">
              <Sparkles className="text-blue-200 h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">تجربة سلسة</h3>
              <p className="text-sm text-neutral-400">
                واجهة حديثة وسهلة الاستخدام تجعل التعلم أكثر متعة وفعالية.
              </p>
            </div>
          </SpotlightCard>

        </div>
      </div>
    </div>
  );
}
