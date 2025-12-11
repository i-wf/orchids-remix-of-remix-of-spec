import { Card } from '@/components/ui/card';
import { ArrowRight, Shield } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-primary hover:underline mb-8 transition-all hover:gap-3"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          العودة للرئيسية
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">سياسة الخصوصية</h1>
            <p className="text-muted-foreground mt-2">آخر تحديث: {new Date().toLocaleDateString('ar-EG')}</p>
          </div>
        </div>

        <Card className="p-6 sm:p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">مقدمة</h2>
            <p className="text-muted-foreground leading-relaxed">
              نحن في منصة التعليم المصرية نلتزم بحماية خصوصيتك وبياناتك الشخصية. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك الشخصية عند استخدام منصتنا التعليمية.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">المعلومات التي نجمعها</h2>
            <div className="space-y-3 text-muted-foreground">
              <p className="leading-relaxed">نقوم بجمع المعلومات التالية:</p>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li>المعلومات الشخصية: الاسم، رقم الهاتف، الصف الدراسي</li>
                <li>معلومات ولي الأمر: رقم هاتف ولي الأمر للطلاب</li>
                <li>معلومات المعلمين: التخصصات، اسم السنتر أو المجموعة</li>
                <li>بيانات الاستخدام: سجلات الدخول، الدروس المشاهدة، نتائج الاختبارات</li>
                <li>بيانات الاشتراك: معلومات الدفع والاشتراكات</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">كيفية استخدام المعلومات</h2>
            <div className="space-y-3 text-muted-foreground">
              <p className="leading-relaxed">نستخدم معلوماتك من أجل:</p>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li>توفير خدمات المنصة التعليمية والمحتوى الدراسي</li>
                <li>تتبع تقدم الطلاب وإرسال التقارير لأولياء الأمور</li>
                <li>معالجة المدفوعات وإدارة الاشتراكات</li>
                <li>تحسين جودة المنصة وتطوير ميزات جديدة</li>
                <li>التواصل معك بخصوص التحديثات والإشعارات المهمة</li>
                <li>ضمان أمان المنصة ومنع الاستخدام غير المصرح به</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">حماية البيانات</h2>
            <p className="text-muted-foreground leading-relaxed">
              نتخذ إجراءات أمنية صارمة لحماية بياناتك، بما في ذلك تشفير كلمات المرور، استخدام اتصالات آمنة (HTTPS)، 
              وتخزين البيانات في خوادم محمية. نلتزم بعدم مشاركة معلوماتك الشخصية مع أطراف ثالثة دون موافقتك، 
              باستثناء ما يقتضيه القانون أو لتقديم الخدمات الأساسية (مثل معالجة المدفوعات).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">حقوقك</h2>
            <div className="space-y-3 text-muted-foreground">
              <p className="leading-relaxed">لديك الحق في:</p>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li>الوصول إلى بياناتك الشخصية وطلب نسخة منها</li>
                <li>تعديل أو تحديث معلوماتك الشخصية</li>
                <li>حذف حسابك وبياناتك من المنصة</li>
                <li>الاعتراض على معالجة بياناتك في حالات معينة</li>
                <li>سحب موافقتك على استخدام بياناتك في أي وقت</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">ملفات تعريف الارتباط (Cookies)</h2>
            <p className="text-muted-foreground leading-relaxed">
              نستخدم ملفات تعريف الارتباط لتحسين تجربتك على المنصة، تذكر تفضيلاتك، وتحليل استخدام الموقع. 
              يمكنك التحكم في إعدادات ملفات تعريف الارتباط من خلال متصفحك.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">التغييرات على السياسة</h2>
            <p className="text-muted-foreground leading-relaxed">
              قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. سنقوم بإشعارك بأي تغييرات جوهرية عبر المنصة أو البريد الإلكتروني. 
              نشجعك على مراجعة هذه الصفحة بشكل دوري للبقاء على اطلاع بآخر التحديثات.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">اتصل بنا</h2>
            <p className="text-muted-foreground leading-relaxed">
              إذا كان لديك أي أسئلة أو استفسارات حول سياسة الخصوصية أو كيفية استخدامنا لبياناتك، 
              يرجى التواصل معنا عبر البريد الإلكتروني: <span className="text-primary">privacy@egyptedu.com</span>
            </p>
          </section>
        </Card>
      </div>
    </div>
  );
}
