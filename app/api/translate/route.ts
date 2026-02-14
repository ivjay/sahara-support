import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, targetLang } = await request.json();

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: 'Missing text or targetLang' },
        { status: 400 }
      );
    }

    // Use MyMemory Translation API (free, no API key needed)
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData) {
      return NextResponse.json({
        translatedText: data.responseData.translatedText,
        originalText: text
      });
    } else {
      // Fallback to original text if translation fails
      return NextResponse.json({
        translatedText: text,
        originalText: text,
        error: 'Translation service unavailable'
      });
    }
  } catch (error) {
    console.error('[Translation API] Error:', error);
    // Return original text if translation fails
    const { text } = await request.json();
    return NextResponse.json({
      translatedText: text,
      originalText: text,
      error: 'Translation failed'
    });
  }
}
