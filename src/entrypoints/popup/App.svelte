<script lang="ts">
  import { storage } from '#imports';
  import { onMount } from 'svelte';

  // Settings interface
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

  // Default settings
  const defaultSettings: Settings = {
    translationDelay: 300,
    languageMappings: [],
    defaultTargetLang: 'en',
    pressToTranslate: false,
    keyToPress: 'ctrl'
  };

  let settings: Settings = { ...defaultSettings };
  let newMapping: LanguageMapping = { sourceLang: '', targetLang: '' };
  let isSaving = false;
  let saveMessage = '';

  // Available languages
  const languages = [
    { code: 'af', name: 'Afrikaans' },
    { code: 'sq', name: 'Albanian' },
    { code: 'am', name: 'Amharic' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hy', name: 'Armenian' },
    { code: 'as', name: 'Assamese' },
    { code: 'ay', name: 'Aymara' },
    { code: 'az', name: 'Azerbaijani' },
    { code: 'bm', name: 'Bambara' },
    { code: 'eu', name: 'Basque' },
    { code: 'be', name: 'Belarusian' },
    { code: 'bn', name: 'Bengali' },
    { code: 'bs', name: 'Bosnian' },
    { code: 'bg', name: 'Bulgarian' },
    { code: 'ca', name: 'Catalan' },
    { code: 'ceb', name: 'Cebuano' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'zh-TW', name: 'Chinese (Traditional)' },
    { code: 'co', name: 'Corsican' },
    { code: 'hr', name: 'Croatian' },
    { code: 'cs', name: 'Czech' },
    { code: 'da', name: 'Danish' },
    { code: 'nl', name: 'Dutch' },
    { code: 'en', name: 'English' },
    { code: 'eo', name: 'Esperanto' },
    { code: 'et', name: 'Estonian' },
    { code: 'fi', name: 'Finnish' },
    { code: 'fr', name: 'French' },
    { code: 'gl', name: 'Galician' },
    { code: 'ka', name: 'Georgian' },
    { code: 'de', name: 'German' },
    { code: 'el', name: 'Greek' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'ht', name: 'Haitian Creole' },
    { code: 'ha', name: 'Hausa' },
    { code: 'haw', name: 'Hawaiian' },
    { code: 'he', name: 'Hebrew' },
    { code: 'hi', name: 'Hindi' },
    { code: 'hu', name: 'Hungarian' },
    { code: 'is', name: 'Icelandic' },
    { code: 'ig', name: 'Igbo' },
    { code: 'id', name: 'Indonesian' },
    { code: 'ga', name: 'Irish' },
    { code: 'it', name: 'Italian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'jv', name: 'Javanese' },
    { code: 'kn', name: 'Kannada' },
    { code: 'kk', name: 'Kazakh' },
    { code: 'km', name: 'Khmer' },
    { code: 'ko', name: 'Korean' },
    { code: 'ku', name: 'Kurdish' },
    { code: 'ky', name: 'Kyrgyz' },
    { code: 'lo', name: 'Lao' },
    { code: 'la', name: 'Latin' },
    { code: 'lv', name: 'Latvian' },
    { code: 'lt', name: 'Lithuanian' },
    { code: 'lb', name: 'Luxembourgish' },
    { code: 'mk', name: 'Macedonian' },
    { code: 'mg', name: 'Malagasy' },
    { code: 'ms', name: 'Malay' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'mt', name: 'Maltese' },
    { code: 'mi', name: 'Maori' },
    { code: 'mr', name: 'Marathi' },
    { code: 'mn', name: 'Mongolian' },
    { code: 'my', name: 'Myanmar (Burmese)' },
    { code: 'ne', name: 'Nepali' },
    { code: 'no', name: 'Norwegian' },
    { code: 'ny', name: 'Nyanja (Chichewa)' },
    { code: 'or', name: 'Odia (Oriya)' },
    { code: 'om', name: 'Oromo' },
    { code: 'ps', name: 'Pashto' },
    { code: 'fa', name: 'Persian' },
    { code: 'pl', name: 'Polish' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'pa', name: 'Punjabi' },
    { code: 'ro', name: 'Romanian' },
    { code: 'ru', name: 'Russian' },
    { code: 'sm', name: 'Samoan' },
    { code: 'gd', name: 'Scots Gaelic' },
    { code: 'sr', name: 'Serbian' },
    { code: 'st', name: 'Sesotho' },
    { code: 'sn', name: 'Shona' },
    { code: 'sd', name: 'Sindhi' },
    { code: 'si', name: 'Sinhala' },
    { code: 'sk', name: 'Slovak' },
    { code: 'sl', name: 'Slovenian' },
    { code: 'so', name: 'Somali' },
    { code: 'es', name: 'Spanish' },
    { code: 'su', name: 'Sundanese' },
    { code: 'sw', name: 'Swahili' },
    { code: 'sv', name: 'Swedish' },
    { code: 'tl', name: 'Tagalog (Filipino)' },
    { code: 'tg', name: 'Tajik' },
    { code: 'ta', name: 'Tamil' },
    { code: 'tt', name: 'Tatar' },
    { code: 'te', name: 'Telugu' },
    { code: 'th', name: 'Thai' },
    { code: 'tr', name: 'Turkish' },
    { code: 'tk', name: 'Turkmen' },
    { code: 'uk', name: 'Ukrainian' },
    { code: 'ur', name: 'Urdu' },
    { code: 'ug', name: 'Uyghur' },
    { code: 'uz', name: 'Uzbek' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'cy', name: 'Welsh' },
    { code: 'xh', name: 'Xhosa' },
    { code: 'yi', name: 'Yiddish' },
    { code: 'yo', name: 'Yoruba' },
    { code: 'zu', name: 'Zulu' }
  ];

  onMount(async () => {
    try {
      // Load saved settings
      const result = await storage.getItem<Settings>('local:settings');
      if (result) {
        settings = { ...defaultSettings, ...result };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      saveMessage = 'Error loading settings. Using defaults.';
    }
  });

  async function saveSettings() {
    isSaving = true;
    saveMessage = '';

    try {
      await storage.setItem('local:settings', settings);
      saveMessage = 'Settings saved successfully!';
    } catch (error) {
      saveMessage = 'Error saving settings. Please try again.';
      console.error('Error saving settings:', error);
    }

    isSaving = false;
    // Clear the message after a delay
    setTimeout(() => {
      saveMessage = '';
    }, 3000);
  }

  function addLanguageMapping() {
    if (
      newMapping.sourceLang &&
      newMapping.targetLang &&
      !settings.languageMappings.some(m => m.sourceLang === newMapping.sourceLang)
    ) {
      settings.languageMappings = [
        ...settings.languageMappings,
        { ...newMapping }
      ];
      newMapping = { sourceLang: '', targetLang: '' };
    }
  }

  function removeLanguageMapping(index: number) {
    settings.languageMappings = settings.languageMappings.filter((_, i) => i !== index);
  }
</script>


<div class="settings-container">
  <h1>Translation Settings</h1>

  <div class="settings-section">
    <h2>General Settings</h2>
    
    <div class="setting-item">
      <label for="translationDelay">
        Translation Delay (ms):
        <input
          type="number"
          id="translationDelay"
          bind:value={settings.translationDelay}
          min="100"
          max="2000"
          step="100"
        />
      </label>
    </div>

    <div class="setting-item">
      <label>
        <input
          type="checkbox"
          bind:checked={settings.pressToTranslate}
        />
        Press to translate
      </label>
    </div>

    {#if settings.pressToTranslate}
      <div class="setting-item">
        <label for="keyToPress">
          Key to press:
          <select id="keyToPress" bind:value={settings.keyToPress}>
            <option value="ctrl">Ctrl</option>
            <option value="alt">Alt</option>
            <option value="cmd">Cmd</option>
            <option value="opt">Option</option>
          </select>
        </label>
      </div>
    {/if}
  </div>

  <div class="settings-section">
    <h2>Language Settings</h2>
    
    <div class="setting-item">
      <label for="defaultTargetLang">
        Default Target Language:
        <select id="defaultTargetLang" bind:value={settings.defaultTargetLang}>
          {#each languages as lang}
            <option value={lang.code}>{lang.name}</option>
          {/each}
        </select>
      </label>
    </div>

    <div class="language-mappings">
      <h3>Language Mappings</h3>
      <p class="mapping-description">
        Configure specific target languages for different source languages.
        If a source language is not configured, the default target language will be used.
      </p>

      <div class="mapping-list">
        {#each settings.languageMappings as mapping, i}
          <div class="mapping-item">
            <select bind:value={mapping.sourceLang}>
              <option value="">Select source language</option>
              {#each languages as lang}
                <option value={lang.code}>{lang.name}</option>
              {/each}
            </select>
            <span>→</span>
            <select bind:value={mapping.targetLang}>
              <option value="">Select target language</option>
              {#each languages as lang}
                <option value={lang.code}>{lang.name}</option>
              {/each}
            </select>
            <button class="remove-btn" on:click={() => removeLanguageMapping(i)} title="Remove mapping">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2" style="vertical-align: middle; margin-right: 6px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              Remove
            </button>
          </div>
        {/each}
      </div>

      <div class="new-mapping">
        <select bind:value={newMapping.sourceLang}>
          <option value="">Select source language</option>
          {#each languages as lang}
            <option
              value={lang.code}
              disabled={settings.languageMappings.some(m => m.sourceLang === lang.code)}
            >
              {lang.name}
            </option>
          {/each}
        </select>
        <span>→</span>
        <select bind:value={newMapping.targetLang}>
          <option value="">Select target language</option>
          {#each languages as lang}
            <option value={lang.code}>{lang.name}</option>
          {/each}
        </select>
        <button on:click={addLanguageMapping} title="Add mapping">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add
        </button>
      </div>
    </div>
  </div>

  <div class="save-section">
    <button
      class="save-btn"
      on:click={saveSettings}
      disabled={isSaving}
    >
      {isSaving ? 'Saving...' : 'Save Settings'}
    </button>
    {#if saveMessage}
      <div class="save-message" class:error={saveMessage.includes('Error')}>
        {saveMessage}
      </div>
    {/if}
  </div>
</div>

<style>
  .settings-container {
    width: 100%;
    max-width: 600px;
    min-width: 400px; /* Ensure minimum width */
    margin: 0 auto;
    padding: 20px 20px 0 20px;
    font-family: system-ui, -apple-system, sans-serif;
    box-sizing: border-box;
  }

  h1 {
    font-size: 24px;
    margin-bottom: 24px;
    color: #1a1a1a;
  }

  h2 {
    font-size: 18px;
    margin: 16px 0;
    color: #333;
  }

  h3 {
    font-size: 16px;
    margin: 12px 0;
    color: #444;
  }

  .settings-section {
    background: #f5f5f5;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 20px;
  }

  .setting-item {
    margin: 12px 0;
  }

  label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }

  input[type="number"] {
    width: 80px;
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  select {
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: white;
  }

  .language-mappings {
    margin-top: 16px;
  }

  .mapping-description {
    font-size: 12px;
    color: #666;
    margin-bottom: 12px;
  }

  .mapping-list {
    margin-bottom: 12px;
  }

  .mapping-item,
  .new-mapping {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    min-height: 36px;
  }

  .new-mapping button {
    margin-left: 8px;
    height: 32px;
    width: 90px; /* Increased width for Add button */
    padding: 0 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .remove-btn {
    padding: 2px 8px;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    height: 32px;
    width: 90px; /* Increased width for Delete button */
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 8px;
  }

  .remove-btn:hover {
    background: #c82333;
  }

  button {
    padding: 4px 12px;
    background: #0066cc;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  button:hover {
    background: #0052a3;
  }

  button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .save-section {
    position: sticky;
    bottom: 0;
    left: 0;
    background: white;
    border-top: 1px solid #eee;
    padding: 12px 0;
    text-align: center;
    z-index: 10;
    min-height: 80px;
  }

  .save-btn {
    width: 100%;
    margin: 0;
    display: block;
    font-size: 16px;
    padding: 12px 0;
    box-sizing: border-box;
  }

  .save-message {
    margin-top: 8px;
    font-size: 14px;
    color: #28a745;
    padding: 8px;
    border-radius: 4px;
    background: #e8f5e9;
    animation: fadeIn 0.3s ease-in;
    min-height: 24px;
    min-width: 100%;
    box-sizing: border-box;
  }

  .save-message.error {
    color: #dc3545;
    background: #fde8e8;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
