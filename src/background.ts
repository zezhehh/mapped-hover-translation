
interface TranslationResponse {
  translation?: string;
  error?: string;
}

async function translateText(text: string, targetLang: string = 'en'): Promise<TranslationResponse> {
  console.log('Background: Translating text:', text);
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
    console.log('Background script loaded');
    browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('Background: Received message:', request);
      if (request.type === 'translate') {
        translateText(request.text)
          .then(sendResponse)
          .catch((error) => {
            console.error('Background: Error in message handler:', error);
            sendResponse({ error: error.message });
          });
        return true; // Will respond asynchronously
      }
    });
  },
}); 