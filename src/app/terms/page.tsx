import { Card } from '@/components/ui/card';
import { ArrowRight, FileText } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
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
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">الشروط والأحكام</h1>
            <p className="text-muted-foreground mt-2">آخر تحديث: {new Date().toLocaleDateString('ar-EG')}</p>
          </div>
        </div>

        <Card className="p-6 sm:p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">مقدمة</h2>
            <p className="text-muted-foreground leading-relaxed">
              مرحباً بك في منصة التعليم المصرية. باستخدامك لهذه المنصة، فإنك توافق على الالتزام بهذه الشروط والأحكام. 
              يرجى قراءتها بعناية قبل استخدام المنصة.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">استخدام المنصة</h2>
            <div className="space-y-3 text-muted-foreground">
              <p className="leading-relaxed">عند استخدام منصتنا، فإنك توافق على:</p>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li>تقديم معلومات صحيحة ودقيقة عند التسجيل</li>
                <li>الحفاظ على سرية بيانات حسابك وكلمة المرور</li>
                <li>استخدام المنصة للأغراض التعليمية المشروعة فقط</li>
                <li>عدم مشاركة أو نسخ المحتوى التعليمي دون إذن</li>
                <li>احترام حقوق الملكية الفكرية للمحتوى المقدم</li>
                <li>عدم محاولة اختراق أو الوصول غير المصرح به للمنصة</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">حسابات المستخدمين</h2>
            <div className="space-y-3 text-muted-foreground">
              <p className="leading-relaxed font-semibold">للطلاب:</p>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li>يجب تقديم رقم هاتف ولي الأمر عند التسجيل</li>
                <li>الالتزام بحضور الدروس والامتحانات في المواعيد المحددة</li>
                <li>احترام المعلمين والطلاب الآخرين على المنصة</li>
              </ul>
              
              <p className="leading-relaxed font-semibold mt-4">للمعلمين:</p>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li>يجب الحصول على كود وصول صالح للتسجيل كمعلم</li>
                <li>تقديم محتوى تعليمي عالي الجودة ومطابق للمنهج المصري</li>
                <li>الالتزام بمواعيد الدروس والرد على استفسارات الطلاب</li>
                <li>عدم استخدام المنصة لأغراض تجارية خارج نطاق التدريس</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">الاشتراكات والمدفوعات</h2>
            <div className="space-y-3 text-muted-foreground">
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li>جميع الأسعار المعروضة بالجنيه المصري وتشمل الضرائب</li>
                <li>يجب إتمام الدفع قبل الوصول إلى المحتوى المدفوع</li>
                <li>الاشتراكات غير قابلة للاسترداد بعد تفعيلها</li>
                <li>يتم تجديد الاشتراكات تلقائياً ما لم يتم إلغاؤها</li>
                <li>في حالة وجود مشكلة في الدفع، يرجى التواصل معنا خلال 48 ساعة</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">المحتوى التعليمي</h2>
            <p className="text-muted-foreground leading-relaxed">
              جميع الدروس، الفيديوهات، المذكرات، والاختبارات المتوفرة على المنصة محمية بحقوق الملكية الفكرية. 
              يُمنع منعاً باتاً نسخ، توزيع، أو مشاركة هذا المحتوى خارج المنصة دون إذن كتابي مسبق. 
              أي انتهاك لهذه الحقوق قد يؤدي إلى إيقاف حسابك واتخاذ إجراءات قانونية.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">السلوك المقبول</h2>
            <div className="space-y-3 text-muted-foreground">
              <p className="leading-relaxed">يُمنع على المستخدمين:</p>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li>نشر محتوى مسيء، عنيف، أو غير لائق</li>
                <li>التنمر أو التحرش بالمستخدمين الآخرين</li>
                <li>انتحال شخصية الآخرين أو استخدام حسابات مزيفة</li>
                <li>إرسال رسائل غير مرغوب فيها أو إعلانات</li>
                <li>استخدام برامج آلية أو روبوتات للوصول إلى المنصة</li>
                <li>محاولة الغش في الاختبارات أو التلاعب بالنتائج</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">إنهاء الحساب</h2>
            <p className="text-muted-foreground leading-relaxed">
              نحتفظ بالحق في تعليق أو إنهاء حسابك في حالة انتهاك هذه الشروط والأحكام، 
              أو في حالة وجود نشاط مشبوه أو غير قانوني. يمكنك أيضاً طلب حذف حسابك في أي وقت من خلال إعدادات الحساب.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">إخلاء المسؤولية</h2>
            <p className="text-muted-foreground leading-relaxed">
              نبذل قصارى جهدنا لتوفير محتوى تعليمي دقيق ومفيد، لكننا لا نضمن دقة أو اكتمال جميع المعلومات. 
              المنصة متاحة "كما هي" دون أي ضمانات صريحة أو ضمنية. لا نتحمل المسؤولية عن أي أضرار مباشرة 
              أو غير مباشرة قد تنجم عن استخدام المنصة.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">تعديل الشروط</h2>
            <p className="text-muted-foreground leading-relaxed">
              نحتفظ بالحق في تعديل هذه الشروط والأحكام في أي وقت. سيتم إشعارك بأي تغييرات جوهرية 
              عبر المنصة أو البريد الإلكتروني. استمرارك في استخدام المنصة بعد التعديلات يعني موافقتك على الشروط الجديدة.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">القانون الواجب التطبيق</h2>
            <p className="text-muted-foreground leading-relaxed">
              تخضع هذه الشروط والأحكام للقوانين المصرية. أي نزاع ينشأ عن استخدام المنصة 
              سيتم حله وفقاً للقوانين المعمول بها في جمهورية مصر العربية.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">اتصل بنا</h2>
            <p className="text-muted-foreground leading-relaxed">
              إذا كان لديك أي أسئلة حول هذه الشروط والأحكام، يرجى التواصل معنا عبر:
              <br />
              البريد الإلكتروني: <span className="text-primary">support@egyptedu.com</span>
              <br />
              الهاتف: <span className="text-primary">0100-123-4567</span>
            </p>
          </section>
        </Card>
      </div>
    </div>
  );
}
