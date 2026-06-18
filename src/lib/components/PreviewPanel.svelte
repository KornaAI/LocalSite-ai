<script lang="ts">
  import { untrack, onDestroy } from 'svelte';
  import { Laptop, Smartphone, Tablet, RefreshCw, Loader2 } from '@lucide/svelte';
  import Button from '$lib/components/ui/Button.svelte';

  interface Props {
    generationComplete: boolean;
    viewportSize: 'desktop' | 'tablet' | 'mobile';
    originalCode: string;
    editedCode: string;
    isGenerating: boolean;
    previewKey: number;
    previewContent: string;
    refreshPreview: () => void;
    setViewportSize: (size: 'desktop' | 'tablet' | 'mobile') => void;
  }

  let {
    generationComplete,
    viewportSize,
    originalCode,
    editedCode,
    isGenerating,
    previewKey,
    previewContent,
    refreshPreview,
    setViewportSize
  }: Props = $props();

  const iframeWidthClass = $derived(
    viewportSize === 'desktop'
      ? 'w-full h-full'
      : viewportSize === 'tablet'
        ? 'w-[768px] max-w-full h-full'
        : 'w-[375px] max-w-full h-full'
  );

  // --- Double Buffering State ---
  let activeFrame = $state<1 | 2>(1);
  let content1 = $state('');
  let content2 = $state('');

  let iframe1 = $state<HTMLIFrameElement>();
  let iframe2 = $state<HTMLIFrameElement>();

  // Manual opacity and z-index control for seamless crossfading
  let opacity1 = $state(1);
  let opacity2 = $state(0);
  let zIndex1 = $state(20);
  let zIndex2 = $state(10);
  let pointerEvents1 = $state<'auto' | 'none'>('auto');
  let pointerEvents2 = $state<'auto' | 'none'>('none');

  let swapTimeout: ReturnType<typeof setTimeout>;
  let fadeOutTimeout: ReturnType<typeof setTimeout>;
  let previousKey = -1;
  let skipNextScrollSync = false;

  // allow-scripts: run generated preview JS. allow-forms: interactive form elements.
  // allow-same-origin: parent reads contentWindow.scrollX/Y to sync scroll between
  // double-buffered iframes during seamless preview swaps (see handleIframeLoad).
  const iframeSandbox = 'allow-scripts allow-forms allow-same-origin';

  onDestroy(() => {
    clearTimeout(swapTimeout);
    clearTimeout(fadeOutTimeout);
  });

  // Trigger swap on content change OR explicit refresh (previewKey)
  $effect(() => {
    const currentKey = previewKey;
    const baseHtml = previewContent;
    
    if (!baseHtml) return;

    // Force strict inequality so Svelte always updates the srcdoc,
    // ensuring the hidden iframe actually reloads and reinitializes JS.
    const html = baseHtml + `\n<!-- update: ${Date.now()}-${Math.random()} -->`;

    untrack(() => {
      if (currentKey !== previousKey) {
        skipNextScrollSync = true;
        previousKey = currentKey;
      } else {
        skipNextScrollSync = false;
      }

      clearTimeout(swapTimeout);

      if (activeFrame === 1) {
        content2 = html;
        swapTimeout = setTimeout(() => handleIframeLoad(2), 400);
      } else {
        content1 = html;
        swapTimeout = setTimeout(() => handleIframeLoad(1), 400);
      }
    });
  });

  function handleIframeLoad(frameNumber: number) {
    clearTimeout(swapTimeout);
    clearTimeout(fadeOutTimeout);
    
    try {
      if (activeFrame === 1 && frameNumber === 2) {
        if (!skipNextScrollSync && iframe1?.contentWindow && iframe2?.contentWindow) {
          iframe2.contentWindow.scrollTo({
            top: iframe1.contentWindow.scrollY,
            left: iframe1.contentWindow.scrollX,
            behavior: 'instant'
          });
        }
        activeFrame = 2;
        zIndex2 = 20; // New frame on top
        zIndex1 = 10; // Old frame underneath
        pointerEvents2 = 'auto';
        pointerEvents1 = 'none';
        opacity2 = 1; // Fade in new frame
        
        // Keep old frame fully opaque until new frame finishes fading in
        fadeOutTimeout = setTimeout(() => {
          opacity1 = 0;
        }, 200);

      } else if (activeFrame === 2 && frameNumber === 1) {
        if (!skipNextScrollSync && iframe1?.contentWindow && iframe2?.contentWindow) {
          iframe1.contentWindow.scrollTo({
            top: iframe2.contentWindow.scrollY,
            left: iframe2.contentWindow.scrollX,
            behavior: 'instant'
          });
        }
        activeFrame = 1;
        zIndex1 = 20; // New frame on top
        zIndex2 = 10; // Old frame underneath
        pointerEvents1 = 'auto';
        pointerEvents2 = 'none';
        opacity1 = 1; // Fade in new frame
        
        // Keep old frame fully opaque until new frame finishes fading in
        fadeOutTimeout = setTimeout(() => {
          opacity2 = 0;
        }, 200);
      }
    } catch (e) {
      activeFrame = frameNumber as 1 | 2;
      // Fallback
      if (activeFrame === 1) {
        opacity1 = 1; opacity2 = 0; zIndex1 = 20; zIndex2 = 10;
        pointerEvents1 = 'auto'; pointerEvents2 = 'none';
      } else {
        opacity1 = 0; opacity2 = 1; zIndex1 = 10; zIndex2 = 20;
        pointerEvents1 = 'none'; pointerEvents2 = 'auto';
      }
    }
    skipNextScrollSync = false;
  }
</script>

<div class="flex h-full flex-col">
  <!-- Preview Toolbar -->
  <div class="flex items-center justify-between border-b border-gray-800 bg-gray-900/50 p-2">
    <h2 class="text-sm font-medium">LIVE PREVIEW</h2>
    <div class="flex items-center gap-1">
      {#if generationComplete}
        <Button
          variant="ghost"
          size="sm"
          class="mr-2 h-7 px-2 text-gray-400 hover:text-white"
          onclick={refreshPreview}
          title="Refresh preview"
        >
          <RefreshCw class="mr-1 h-4 w-4" />
          <span class="hidden text-xs sm:inline">Refresh</span>
        </Button>
      {/if}
      <Button
        variant={viewportSize === 'desktop' ? 'secondary' : 'ghost'}
        size="sm"
        class="h-7 w-7 p-0"
        aria-label="Desktop view"
        onclick={() => setViewportSize('desktop')}
      >
        <Laptop class="h-4 w-4" />
      </Button>
      <Button
        variant={viewportSize === 'tablet' ? 'secondary' : 'ghost'}
        size="sm"
        class="h-7 w-7 p-0"
        aria-label="Tablet view"
        onclick={() => setViewportSize('tablet')}
      >
        <Tablet class="h-4 w-4" />
      </Button>
      <Button
        variant={viewportSize === 'mobile' ? 'secondary' : 'ghost'}
        size="sm"
        class="h-7 w-7 p-0"
        aria-label="Mobile view"
        onclick={() => setViewportSize('mobile')}
      >
        <Smartphone class="h-4 w-4" />
      </Button>
    </div>
  </div>

  <!-- Iframe Viewport Area -->
  <div class="flex flex-1 items-center justify-center overflow-hidden p-3">
    <div
      class="overflow-hidden rounded-md border border-gray-800 bg-gray-900 transition-all duration-300 {iframeWidthClass}"
    >
      {#if !originalCode && !editedCode}
        <div class="flex h-full w-full items-center justify-center bg-gray-900 text-gray-400">
          {#if isGenerating}
            <div class="text-center">
              <Loader2 class="mx-auto mb-2 h-8 w-8 animate-spin" />
              <p>Generating preview...</p>
            </div>
          {:else}
            <p>No preview available yet</p>
          {/if}
        </div>
      {:else}
        <div class="relative h-full w-full">
          <iframe
            bind:this={iframe1}
            srcdoc={content1}
            onload={() => handleIframeLoad(1)}
            class="absolute inset-0 h-full w-full transition-opacity duration-200 ease-in-out"
            title="Preview 1"
            sandbox={iframeSandbox}
            style="background-color: #121212; opacity: {opacity1}; z-index: {zIndex1}; pointer-events: {pointerEvents1};"
          ></iframe>
          <iframe
            bind:this={iframe2}
            srcdoc={content2}
            onload={() => handleIframeLoad(2)}
            class="absolute inset-0 h-full w-full transition-opacity duration-200 ease-in-out"
            title="Preview 2"
            sandbox={iframeSandbox}
            style="background-color: #121212; opacity: {opacity2}; z-index: {zIndex2}; pointer-events: {pointerEvents2};"
          ></iframe>

          {#if isGenerating}
            <div
              class="absolute bottom-4 right-4 z-20 flex items-center rounded-full bg-gray-800/80 px-3 py-1 text-xs text-white"
            >
              <Loader2 class="mr-1 h-3 w-3 animate-spin" />
              Updating preview...
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>
