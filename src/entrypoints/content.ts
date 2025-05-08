import { mount } from 'svelte';
import { browser } from 'wxt/browser';
import { storage } from '#imports';
import TranslationPopup from '../components/TranslationPopup.svelte';

interface LanguageMapping {
  sourceLang: string;
  targetLang: string;
}

interface Settings {
  translationDelay: number;
  languageMappings: LanguageMapping[];
  defaultTargetLang: string;
  pressToTranslate: boolean;
  keyToPress: 'ctrl' | 'alt' | 'cmd' | 'opt';
}

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    let popupRoot: HTMLElement | null = null;
    let currentPopup: any = null;
    let isKeyPressed = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let hoverTimer: number | null = null;
    let selectionTimer: number | null = null;
    let lastTranslatedText: string | null = null;
    let lastTranslatedResult: string | null = null;
    let lastTranslationPosition = { x: 0, y: 0 };
    let settings: Settings = {
      translationDelay: 500,
      languageMappings: [],
      defaultTargetLang: 'en',
      pressToTranslate: true,
      keyToPress: 'alt'
    };

    // Load settings from storage
    async function loadSettings() {
      const result = await storage.getItem<Settings>('local:settings');
      if (result) {
        settings = result;
      }
    }

    // Check if the required key is pressed
    function isRequiredKeyPressed(e: KeyboardEvent | MouseEvent): boolean {
      if (!settings.pressToTranslate) return true;
      
      switch (settings.keyToPress) {
        case 'ctrl':
          return e.ctrlKey;
        case 'alt':
          return e.altKey;
        case 'cmd':
          return e.metaKey;
        case 'opt':
          return e.altKey;
        default:
          return true;
      }
    }

    // Get target language for source language
    function getTargetLanguage(sourceLang: string): string {
      const mapping = settings.languageMappings.find(m => m.sourceLang === sourceLang);
      return mapping ? mapping.targetLang : settings.defaultTargetLang;
    }

    function createPopupElement() {
      const div = document.createElement('div');
      div.id = 'translation-popup';
      document.body.appendChild(div);
      return div;
    }

    function showPopup(text: string, x: number, y: number) {
      console.log('Showing popup with text:', text);
      if (!popupRoot) {
        popupRoot = createPopupElement();
      }

      if (currentPopup) {
        // Remove the old popup element
        popupRoot.innerHTML = '';
      }

      // Position the popup next to the mouse cursor
      const popupX = x + 15; // Offset from cursor
      const popupY = y - 10; // Slightly above cursor

      currentPopup = mount(TranslationPopup, {
        target: popupRoot,
        props: {
          text,
          x: popupX,
          y: popupY,
        },
      });
    }

    function hidePopup() {
      console.log('Hiding popup');
      if (popupRoot) {
        popupRoot.innerHTML = '';
        currentPopup = null;
      }
    }

    function getSelectedText(): string {
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : '';
      console.log('Selected text:', text);
      return text;
    }

    function getWordAtPoint(x: number, y: number): string {
      // Get the element at the point
      const element = document.elementFromPoint(x, y);
      if (!element) return '';

      // Get all text nodes under the element
      const textNodes: Text[] = [];
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null
      );

      let node: Text | null;
      while (node = walker.nextNode() as Text) {
        textNodes.push(node);
      }

      // Find the text node and offset at the point
      const range = document.caretRangeFromPoint(x, y);
      if (!range) return '';

      const textNode = range.startContainer;
      if (textNode.nodeType !== Node.TEXT_NODE) return '';

      const text = textNode.textContent || '';
      const offset = range.startOffset;

      // Find the word boundaries
      const beforeText = text.slice(0, offset);
      const afterText = text.slice(offset);

      // Match word characters before and after the cursor
      const beforeMatch = beforeText.match(/[\p{L}\p{N}_-]+$/u);
      const afterMatch = afterText.match(/^[\p{L}\p{N}_-]+/u);

      const before = beforeMatch ? beforeMatch[0] : '';
      const after = afterMatch ? afterMatch[0] : '';

      const word = (before + after).trim();
      console.log('Word at point:', {
        text,
        offset,
        before,
        after,
        word
      });
      return word;
    }

    async function translateText(text: string) {
      console.log('Translating text:', text);
      try {
        // First, detect the source language
        const detectResponse = await browser.runtime.sendMessage({
          type: 'detect',
          text
        });
        
        const sourceLang = detectResponse?.language || 'auto';
        console.log('Detected source language:', sourceLang);
        
        // Get the target language based on the detected source language
        const targetLang = getTargetLanguage(sourceLang);
        console.log('Using target language:', targetLang, 'for source language:', sourceLang);
        
        const response = await browser.runtime.sendMessage({
          type: 'translate',
          text,
          targetLang
        });
        console.log('Translation response:', response);

        if (response.translation) {
          return response.translation;
        }
        return null;
      } catch (error: any) {
        // Check if the error is due to invalid context
        if (error.message?.includes('Extension context invalidated')) {
          console.log('Extension context invalidated, reloading content script...');
          // Reload the content script
          window.location.reload();
          return null;
        }
        throw error; // Re-throw other errors
      }
    }

    async function handleTranslation(e: MouseEvent, forceNewTranslation: boolean = false) {
      // If press-to-translate is enabled, only translate when key is pressed
      if (settings.pressToTranslate && !isKeyPressed) {
        hidePopup();
        return;
      }

      const selectedText = getSelectedText();
      let text = selectedText;
      let popupX = e.clientX;
      let popupY = e.clientY;
      
      if (!text) {
        text = getWordAtPoint(e.clientX, e.clientY);
        console.log('No selection, getting word at point:', text);
      } else {
        // Get the selection's bounding rectangle for positioning
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          // Position popup below the selection
          popupX = rect.left;
          popupY = rect.bottom + 5; // 5px below the selection
        }
      }

      if (!text) {
        console.log('No text to translate');
        hidePopup();
        return;
      }

      // In press-to-translate mode, if we already have a translation and we're not forcing a new one,
      // just show the existing translation at the new position
      if (settings.pressToTranslate && lastTranslatedResult && !forceNewTranslation) {
        console.log('Using existing translation in press-to-translate mode');
        showPopup(lastTranslatedResult, popupX, popupY);
        return;
      }

      // Check if we've already translated this text
      if (text === lastTranslatedText && lastTranslatedResult) {
        console.log('Using cached translation for:', text);
        // Add offset for non-selected text (when using mouse position)
        if (!selectedText) {
          popupX += 15; // Offset from cursor
          popupY -= 10; // Slightly above cursor
        }
        showPopup(lastTranslatedResult, popupX, popupY);
        return;
      }

      console.log('Translating new text:', text);
      const translation = await translateText(text);
      if (translation) {
        // Cache the translation
        lastTranslatedText = text;
        lastTranslatedResult = translation;
        lastTranslationPosition = { x: popupX, y: popupY };
        
        // Add offset for non-selected text (when using mouse position)
        if (!selectedText) {
          popupX += 15; // Offset from cursor
          popupY -= 10; // Slightly above cursor
        }
        showPopup(translation, popupX, popupY);
      }
    }

    function handleSelectionChange() {
      // In press-to-translate mode, don't handle selection changes at all
      if (settings.pressToTranslate) {
        return;
      }

      const selectedText = getSelectedText();
      if (!selectedText) {
        hidePopup();
        return;
      }

      // Clear any existing selection timer
      if (selectionTimer) {
        window.clearTimeout(selectionTimer);
      }

      // Set a new timer to update translation
      selectionTimer = window.setTimeout(() => {
        // Get the selection's bounding rectangle
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          // Create a mouse event at the selection position
          const mouseEvent = new MouseEvent('mousemove', {
            clientX: rect.left,
            clientY: rect.bottom
          });
          
          // Trigger translation update
          handleTranslation(mouseEvent);
        }
      }, settings.translationDelay);
    }

    function handleMouseMove(e: MouseEvent) {
      // Update last known mouse position
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;

      if (settings.pressToTranslate) {
        // In press-to-translate mode, only translate when key is pressed
        if (isKeyPressed) {
          // Only show the existing translation at the new position
          handleTranslation(e, false);
        } else {
          hidePopup();
        }
        return; // Early return to prevent any other translation behavior
      }

      // Only reach here if press-to-translate is disabled
      if (hoverTimer) {
        window.clearTimeout(hoverTimer);
      }
      hoverTimer = window.setTimeout(() => {
        handleTranslation(e, true);
      }, settings.translationDelay);
    }

    function handleMouseOut() {
      hidePopup();
      if (hoverTimer) {
        window.clearTimeout(hoverTimer);
        hoverTimer = null;
      }
      if (selectionTimer) {
        window.clearTimeout(selectionTimer);
        selectionTimer = null;
      }
      // Reset key state when mouse leaves the window
      if (settings.pressToTranslate) {
        isKeyPressed = false;
        lastTranslatedText = null;
        lastTranslatedResult = null;
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (!settings.pressToTranslate) {
        return; // Ignore key events if press-to-translate is disabled
      }

      if (isRequiredKeyPressed(e)) {
        console.log('Key pressed, enabling translations');
        isKeyPressed = true;
        // Use the last known mouse position
        const mouseEvent = new MouseEvent('mousemove', {
          clientX: lastMouseX,
          clientY: lastMouseY
        });
        // Force a new translation when key is pressed
        handleTranslation(mouseEvent, true);
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (!settings.pressToTranslate) {
        return; // Ignore key events if press-to-translate is disabled
      }

      if (isRequiredKeyPressed(e)) {
        console.log('Key released, disabling translations');
        isKeyPressed = false;
        hidePopup();
        // Clear any pending timers
        if (hoverTimer) {
          window.clearTimeout(hoverTimer);
          hoverTimer = null;
        }
        if (selectionTimer) {
          window.clearTimeout(selectionTimer);
          selectionTimer = null;
        }
        // Clear translation cache when key is released
        lastTranslatedText = null;
        lastTranslatedResult = null;
      }
    }

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('selectionchange', handleSelectionChange);

    // Initialize settings when the content script loads
    loadSettings().catch((error: any) => {
      console.error('Failed to load settings:', error);
      if (error.message?.includes('Extension context invalidated')) {
        window.location.reload();
      }
    });

    // Listen for settings changes
    let unwatch: (() => void) | null = null;
    try {
      unwatch = storage.watch<Settings>('local:settings', (newSettings) => {
        if (newSettings) {
          settings = newSettings;
          // Reset state when settings change
          isKeyPressed = false;
          hidePopup();
          if (hoverTimer) {
            window.clearTimeout(hoverTimer);
            hoverTimer = null;
          }
          if (selectionTimer) {
            window.clearTimeout(selectionTimer);
            selectionTimer = null;
          }
          // Clear translation cache when settings change
          lastTranslatedText = null;
          lastTranslatedResult = null;
        }
      });
    } catch (error: any) {
      console.error('Failed to watch settings:', error);
      if (error.message?.includes('Extension context invalidated')) {
        window.location.reload();
      }
    }

    // Cleanup function
    function cleanup() {
      if (unwatch) {
        unwatch();
      }
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('selectionchange', handleSelectionChange);
    }

    // Listen for extension unload
    browser.runtime.onConnect.addListener(port => {
      port.onDisconnect.addListener(() => {
        cleanup();
      });
    });

    console.log('Content script loaded');
  }
});
