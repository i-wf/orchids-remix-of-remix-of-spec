import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message || message.trim() === '') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not configured');
      return NextResponse.json(
        { 
          response: 'أهلاً بك! أنا مساعد المنهج المصري الذكي.\n\nيمكنني مساعدتك في:\n• شرح المواد الدراسية\n• حل المسائل الرياضية\n• تلخيص الدروس\n• نصائح للمذاكرة\n\nاسألني أي سؤال!' 
        },
        { status: 200 }
      );
    }

    const systemPrompt = `أنت مساعد تعليمي ذكي متخصص في المنهج المصري من الصف الرابع الابتدائي إلى الثالث الثانوي.

مهامك:
• الإجابة على أسئلة الطلاب في جميع المواد (رياضيات، عربي، علوم، إنجليزي، دراسات، فيزياء، كيمياء، أحياء)
• تقديم نصائح للمذاكرة الفعالة والاستعداد للامتحانات
• تحفيز وتشجيع الطلاب
• شرح المفاهيم بطريقة واضحة وبسيطة
• تقديم أمثلة عملية ونصائح مفيدة

قواعد مهمة:
• أجب دائماً باللغة العربية الفصحى المبسطة
• كن مشجعاً وإيجابياً
• قدم إجابات مفصلة ومفيدة
• استخدم أمثلة من المنهج المصري عندما يكون ذلك مناسباً
• إذا لم تعرف إجابة محددة، وجّه الطالب لمصادر مفيدة

سؤال الطالب: ${message}`;

    // Try with gemini-1.5-flash (faster and more reliable)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: systemPrompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            topP: 0.95,
            topK: 40
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_NONE"
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', response.status, errorData);
      
      // Return helpful fallback
      return NextResponse.json(
        { 
          response: `أهلاً! سؤالك: "${message}"\n\nأنا هنا لمساعدتك! يمكنني:\n• شرح المواد الدراسية (رياضيات، علوم، عربي، إنجليزي)\n• حل المسائل والتمارين\n• تلخيص الدروس\n• نصائح للمذاكرة والامتحانات\n\nهل يمكنك توضيح سؤالك أكثر؟`
        },
        { status: 200 }
      );
    }

    const data = await response.json();
    
    // Check if we have a valid response
    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
      const aiResponse = data.candidates[0].content.parts[0].text;
      return NextResponse.json({ response: aiResponse }, { status: 200 });
    }
    
    // If blocked or no response, provide helpful message
    return NextResponse.json(
      { 
        response: `شكراً على سؤالك عن: "${message}"\n\nأنا مساعد المنهج المصري. يمكنني مساعدتك في:\n\n📚 شرح المواد الدراسية\n📝 حل الواجبات والتمارين\n💡 نصائح للمذاكرة الفعالة\n🎯 استراتيجيات النجاح في الامتحانات\n\nجرب أن تسألني سؤالاً محدداً في أي مادة!`
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Chatbot error:', error);
    
    return NextResponse.json(
      { 
        response: 'أهلاً بك! أنا مساعد المنهج المصري الذكي.\n\nيمكنني مساعدتك في:\n• شرح المواد الدراسية (رياضيات، علوم، عربي، إنجليزي)\n• حل المسائل والتمارين\n• تلخيص الدروس\n• نصائح للمذاكرة والامتحانات\n\nما هو سؤالك؟' 
      },
      { status: 200 }
    );
  }
}