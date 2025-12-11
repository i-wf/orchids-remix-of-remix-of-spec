import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lessons, homeworkQuestions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lessonId } = body;

    if (!lessonId) {
      return NextResponse.json(
        { error: 'lessonId is required' },
        { status: 400 }
      );
    }

    const lesson = await db.select().from(lessons).where(eq(lessons.id, parseInt(lessonId))).limit(1);
    if (lesson.length === 0) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }
    const lessonData = lesson[0];

    const contentParts: string[] = [];
    if (lessonData.title) contentParts.push(`عنوان الدرس: ${lessonData.title}`);
    if (lessonData.description) contentParts.push(`وصف الدرس: ${lessonData.description}`);
    if (lessonData.lessonNotes) contentParts.push(`ملاحظات المعلم: ${lessonData.lessonNotes}`);

    if (contentParts.length === 0) {
      return NextResponse.json(
        { error: 'لا يوجد محتوى للدرس. يرجى إضافة عنوان أو وصف أو ملاحظات للدرس أولاً.' },
        { status: 400 }
      );
    }

    const textToProcess = contentParts.join('\n\n');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const prompt = `أنت مساعد تعليمي ذكي. قم بإنشاء أسئلة اختيار من متعدد من النص التالي.

النص:
${textToProcess}

قم بإنشاء 5-8 أسئلة اختيار من متعدد في صيغة JSON كالتالي:
[
  {
    "questionText": "نص السؤال هنا",
    "optionA": "الخيار الأول",
    "optionB": "الخيار الثاني",
    "optionC": "الخيار الثالث",
    "optionD": "الخيار الرابع",
    "correctAnswer": "a",
    "explanation": "شرح الإجابة الصحيحة"
  }
]

تأكد من أن:
• الأسئلة تغطي المفاهيم الأساسية في النص
• الخيارات منطقية ومتقاربة في الصعوبة
• الإجابة الصحيحة هي حرف واحد فقط: a أو b أو c أو d
• الشرح واضح ومفيد للطالب

الأسئلة (JSON فقط):`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const data = await response.json();
    let questionsText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    questionsText = questionsText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let generatedQuestions = [];
    try {
      generatedQuestions = JSON.parse(questionsText);
      for (const q of generatedQuestions) {
        await db.insert(homeworkQuestions).values({
          lessonId: parseInt(lessonId),
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer.toLowerCase(),
          explanation: q.explanation || null,
          createdAt: new Date().toISOString()
        });
      }
    } catch (parseError) {
      console.error('Failed to parse questions JSON:', parseError);
      return NextResponse.json(
        { error: 'فشل في معالجة استجابة الذكاء الاصطناعي' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        questions: generatedQuestions,
        lessonId,
        message: 'تم إنشاء أسئلة الواجب بنجاح'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('AI homework generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate homework: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
