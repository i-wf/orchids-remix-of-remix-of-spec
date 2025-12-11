import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lessons, videoTranscripts, aiSummaries, flashcards } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, lessonId, action } = body;

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

    let textToProcess = transcript;
    if (!textToProcess) {
      const existingTranscript = await db.select()
        .from(videoTranscripts)
        .where(eq(videoTranscripts.lessonId, parseInt(lessonId)))
        .limit(1);
      
      if (existingTranscript.length > 0 && existingTranscript[0].transcriptText) {
        textToProcess = existingTranscript[0].transcriptText;
      }
    }

    if (!textToProcess) {
      const contentParts: string[] = [];
      if (lessonData.title) contentParts.push(`عنوان الدرس: ${lessonData.title}`);
      if (lessonData.description) contentParts.push(`وصف الدرس: ${lessonData.description}`);
      if (lessonData.lessonNotes) contentParts.push(`ملاحظات المعلم: ${lessonData.lessonNotes}`);
      
      if (contentParts.length > 0) {
        textToProcess = contentParts.join('\n\n');
      } else {
        return NextResponse.json(
          { error: 'لا يوجد محتوى للدرس (نص، وصف، أو ملاحظات). يرجى إضافة محتوى للدرس أولاً.' },
          { status: 400 }
        );
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const summaryPrompt = `أنت مساعد تعليمي ذكي. قم بإنشاء ملخص تعليمي شامل باللغة العربية من النص التالي.

النص:
${textToProcess}

قم بإنشاء ملخص منظم يتضمن:
• النقاط الرئيسية والمفاهيم الأساسية
• الأمثلة والتطبيقات العملية
• الملاحظات المهمة التي يجب تذكرها

الملخص:`;

    const summaryResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: summaryPrompt }] }]
        })
      }
    );

    if (!summaryResponse.ok) {
      throw new Error(`Summary generation failed: ${summaryResponse.status}`);
    }

    const summaryData = await summaryResponse.json();
    const summary = summaryData.candidates?.[0]?.content?.parts?.[0]?.text || 'فشل إنشاء الملخص';

    const existingSummary = await db.select()
      .from(aiSummaries)
      .where(eq(aiSummaries.lessonId, parseInt(lessonId)))
      .limit(1);

    if (existingSummary.length > 0) {
      await db.update(aiSummaries)
        .set({ summaryText: summary })
        .where(eq(aiSummaries.lessonId, parseInt(lessonId)));
    } else {
      await db.insert(aiSummaries).values({
        lessonId: parseInt(lessonId),
        summaryText: summary,
        createdAt: new Date().toISOString()
      });
    }

    const flashcardsPrompt = `أنت مساعد تعليمي ذكي. قم بإنشاء بطاقات تعليمية (flashcards) من النص التالي.

النص:
${textToProcess}

قم بإنشاء 5-10 بطاقات تعليمية في صيغة JSON كالتالي:
[
  {
    "question": "السؤال هنا",
    "answer": "الإجابة هنا",
    "explanation": "شرح إضافي (اختياري)"
  }
]

تأكد من أن:
• الأسئلة واضحة ومباشرة
• الإجابات دقيقة وموجزة
• الشروحات مفيدة للفهم العميق

البطاقات التعليمية (JSON فقط):`;

    const flashcardsResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: flashcardsPrompt }] }]
        })
      }
    );

    let generatedFlashcards = [];
    if (flashcardsResponse.ok) {
      const flashcardsData = await flashcardsResponse.json();
      let flashcardsText = flashcardsData.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      flashcardsText = flashcardsText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        generatedFlashcards = JSON.parse(flashcardsText);
        for (const card of generatedFlashcards) {
          await db.insert(flashcards).values({
            lessonId: parseInt(lessonId),
            question: card.question,
            answer: card.answer,
            explanation: card.explanation || null,
            type: 'ai',
            createdAt: new Date().toISOString()
          });
        }
      } catch (parseError) {
        console.error('Failed to parse flashcards JSON:', parseError);
      }
    }

    return NextResponse.json(
      {
        summary,
        flashcards: generatedFlashcards,
        lessonId,
        message: 'تم إنشاء الملخص والبطاقات بنجاح'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('AI processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process with AI: ' + (error as Error).message },
      { status: 500 }
    );
  }
}