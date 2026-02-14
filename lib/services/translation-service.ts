/**
 * Translates text from English to Nepali using MyMemory Translation API
 * @param text English text to translate
 * @returns Translated Nepali text
 */
export async function translateToNepali(text: string): Promise<string> {
  try {
    console.log('[Translation] Translating to Nepali:', text);

    // Use MyMemory Translation API (free, no API key needed)
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ne`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      console.log('[Translation] ✓ Result:', data.responseData.translatedText);
      return data.responseData.translatedText;
    }

    // Fallback to original text
    console.warn('[Translation] ⚠ Translation unavailable, using original text');
    return text;
  } catch (error) {
    console.error('[Translation] ✗ Error:', error);
    // Fallback to original text if translation fails
    return text;
  }
}

/**
 * Detects if text contains Nepali script or common Nepali words
 * @param text Text to check
 * @returns true if Nepali is detected
 */
export function isNepaliText(text: string): boolean {
  // Check for Devanagari script (Nepali)
  const devanagariPattern = /[\u0900-\u097F]/;
  if (devanagariPattern.test(text)) {
    return true;
  }

  // Check for common Romanized Nepali words
  const nepaliWords = /\b(namaste|tapai|ma|cha|chha|huncha|thik|ramro|kati|gara|paryo|chai|lai|ko|mero|timro|hajur|dhanyabad|malai|timi|hijo|aaja|bholi|jane|aune|hernu|dekhnu|chahiyo|biramii?|bachha|kata|kasto|kasari|kun|kaha)\b/i;
  if (nepaliWords.test(text)) {
    return true;
  }

  return false;
}
