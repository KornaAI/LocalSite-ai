<script lang="ts">
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
        ? 'w-[768px] max-h-full'
        : 'w-[375px] max-h-full'
  );
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
        onclick={() => setViewportSize('desktop')}
      >
        <Laptop class="h-4 w-4" />
      </Button>
      <Button
        variant={viewportSize === 'tablet' ? 'secondary' : 'ghost'}
        size="sm"
        class="h-7 w-7 p-0"
        onclick={() => setViewportSize('tablet')}
      >
        <Tablet class="h-4 w-4" />
      </Button>
      <Button
        variant={viewportSize === 'mobile' ? 'secondary' : 'ghost'}
        size="sm"
        class="h-7 w-7 p-0"
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
          {#key previewKey}
            <iframe
              srcdoc={previewContent}
              class="absolute inset-0 z-10 h-full w-full"
              title="Preview"
              sandbox="allow-scripts"
              style="background-color: #121212; opacity: 1; transition: opacity 0.15s ease-in-out;"
            ></iframe>
          {/key}

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
