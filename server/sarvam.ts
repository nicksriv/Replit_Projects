interface SarvamTranslateRequest {
  model: string;
  source_language_code: string;
  target_language_code: string;
  input: string;
  enable_preprocessing?: boolean;
}

interface SarvamTranslateResponse {
  translated_text: string;
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en-IN', name: 'English' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'ta-IN', name: 'Tamil' },
  { code: 'te-IN', name: 'Telugu' },
  { code: 'bn-IN', name: 'Bengali' },
  { code: 'gu-IN', name: 'Gujarati' },
  { code: 'kn-IN', name: 'Kannada' },
  { code: 'ml-IN', name: 'Malayalam' },
  { code: 'mr-IN', name: 'Marathi' },
  { code: 'pa-IN', name: 'Punjabi' },
  { code: 'or-IN', name: 'Odia' },
  { code: 'as-IN', name: 'Assamese' },
  { code: 'ur-IN', name: 'Urdu' },
];

export async function translateText(
  text: string,
  sourceLanguage: string = 'en-IN',
  targetLanguage: string = 'hi-IN'
): Promise<string> {
  const apiKey = process.env.SARVAM_API_KEY;
  
  if (!apiKey) {
    throw new Error('SARVAM_API_KEY is not configured');
  }

  try {
    const requestBody: SarvamTranslateRequest = {
      model: 'sarvam-translate:v1',
      source_language_code: sourceLanguage,
      target_language_code: targetLanguage,
      input: text,
      enable_preprocessing: true,
    };

    const response = await fetch('https://api.sarvam.ai/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sarvam API error: ${response.status} - ${errorText}`);
    }

    const data: SarvamTranslateResponse = await response.json();
    return data.translated_text;
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error(`Failed to translate text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function translateInChunks(
  text: string,
  sourceLanguage: string = 'en-IN',
  targetLanguage: string = 'hi-IN',
  chunkSize: number = 5000
): Promise<string> {
  if (text.length <= chunkSize) {
    return translateText(text, sourceLanguage, targetLanguage);
  }

  const chunks: string[] = [];
  let currentChunk = '';
  const sentences = text.split(/(?<=[.!?])\s+/);

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  const translatedChunks: string[] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    console.log(`Translating chunk ${i + 1}/${chunks.length}`);
    const translated = await translateText(chunks[i], sourceLanguage, targetLanguage);
    translatedChunks.push(translated);
    
    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return translatedChunks.join(' ');
}
