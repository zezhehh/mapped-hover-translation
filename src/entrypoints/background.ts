import { browser } from 'wxt/browser';

interface TranslationResponse {
  translation?: string;
  error?: string;
}

interface TranslationRequest {
  type: 'translate' | 'detect';
  text: string;
  targetLang?: string;
}

interface DetectionResponse {
  language?: string;
  error?: string;
}

async function detectLanguage(text: string): Promise<DetectionResponse> {
  console.log('Background: Detecting language for text:', text);
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    console.log('Background: Detection URL:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Language detection API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Background: Detection API response:', data);
    
    // The detected language is in the second element of the response
    const detectedLang = data[2] || 'auto';
    console.log('Background: Detected language:', detectedLang);
    return { language: detectedLang };
  } catch (error) {
    console.error('Background: Language detection error:', error);
    return { error: 'Failed to detect language' };
  }
}

async function translateText(text: string, targetLang: string = 'en'): Promise<TranslationResponse> {
  console.log('Background: Translating text:', text, 'to language:', targetLang);
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    console.log('Background: Translation URL:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Translation API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Background: Translation API response:', data);
    
    const translation = data[0]
      .map((item: any[]) => item[0])
      .filter(Boolean)
      .join(' ');

    console.log('Background: Processed translation:', translation);
    return { translation };
  } catch (error) {
    console.error('Background: Translation error:', error);
    return { error: 'Failed to translate text' };
  }
}

export default defineBackground({
  main() {
    // Listen for messages from content script
    browser.runtime.onMessage.addListener((request: TranslationRequest, sender, sendResponse) => {
      console.log('Background: Received message:', request);
      
      if (request.type === 'detect') {
        detectLanguage(request.text)
          .then(sendResponse)
          .catch((error) => {
            console.error('Background: Error in detection handler:', error);
            sendResponse({ error: error.message });
          });
        return true; // Will respond asynchronously
      }
      
      if (request.type === 'translate') {
        translateText(request.text, request.targetLang)
          .then(sendResponse)
          .catch((error) => {
            console.error('Background: Error in translation handler:', error);
            sendResponse({ error: error.message });
          });
        return true; // Will respond asynchronously
      }
    });

    console.log('Background script loaded');
  }
});
