<script lang="ts">
  export let text: string;
  export let x: number;
  export let y: number;

  let popupElement: HTMLDivElement;

  $: if (popupElement) {
    // Position the popup near the mouse cursor
    const rect = popupElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate position to keep popup within viewport
    let left = x + 10; // Offset from cursor
    let top = y + 10;

    // Adjust if popup would go off right edge
    if (left + rect.width > viewportWidth) {
      left = x - rect.width - 10;
    }

    // Adjust if popup would go off bottom edge
    if (top + rect.height > viewportHeight) {
      top = y - rect.height - 10;
    }

    popupElement.style.left = `${left}px`;
    popupElement.style.top = `${top}px`;
  }
</script>

<div
  bind:this={popupElement}
  class="translation-popup"
  style="position: fixed; z-index: 10000; background: white; border: 1px solid #ccc; border-radius: 4px; padding: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"
>
  {text}
</div>

<style>
  .translation-popup {
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    line-height: 1.4;
    max-width: 300px;
    word-wrap: break-word;
  }
</style> 