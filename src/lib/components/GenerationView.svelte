<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { toast } from 'svelte-sonner';
  import { Pane, PaneGroup, PaneResizer } from 'paneforge';
  import { Download, RefreshCw } from '@lucide/svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Dialog from '$lib/components/ui/Dialog.svelte';
  import ThinkingIndicator from '$lib/components/ThinkingIndicator.svelte';
  import CodePanel from '$lib/components/CodePanel.svelte';
  import PreviewPanel from '$lib/components/PreviewPanel.svelte';

  interface Props {
    prompt: string;
    model: string;
    provider?: string;
    generatedCode: string;
    isGenerating: boolean;
    generationComplete: boolean;
    thinkingOutput?: string;
    isThinking?: boolean;
    onRegenerateWithNewPrompt: (newPrompt: string) => void;
    onRestart: () => void;
  }

  let {
    prompt,
    model,
    provider = '',
    generatedCode,
    isGenerating,
    generationComplete,
    thinkingOutput = '',
    isThinking = false,
    onRegenerateWithNewPrompt,
    onRestart
  }: Props = $props();

  const injectedSetup = `
  <style>
    :root { color-scheme: dark; }
    body { margin: 0; padding: 0; min-height: 100vh; }
  </style>
  <script>
    document.addEventListener('click', e => {
      const a = e.target.closest('a');
      if (a) {
        const href = a.getAttribute('href') || '';
        
        if (href.startsWith('#')) {
          e.preventDefault();
          
          if (window.location.hash !== href && href !== '#') {
            window.location.hash = href;
          } else if (href === '#') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          
          if (href.length > 1) {
            try {
              const target = document.getElementById(href.substring(1));
              if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
              }
            } catch (err) {}
          }
          return;
        }
        
        e.preventDefault();
      }
    });
  <\/script>
`;

  function prepareHtmlContent(code: string): string {
    const fastForwardStyle = isGenerating ? `
      <style>
        * {
          animation-duration: 0.001s !important;
          animation-delay: 0s !important;
          transition-duration: 0.001s !important;
          transition-delay: 0s !important;
        }
      </style>
    ` : '';
    
    const injected = injectedSetup + fastForwardStyle;

    if (/<\s*head[^>]*>/i.test(code)) {
      return code.replace(/<\s*head[^>]*>/i, (match) => `${match}${injected}`);
    } else if (/<\s*html[^>]*>/i.test(code)) {
      return code.replace(/<\s*html[^>]*>/i, (match) => `${match}<head>${injected}</head>`);
    }
    return `
      <!DOCTYPE html>
      <html>
        <head>${injected}</head>
        <body>${code}</body>
      </html>
    `;
  }

  // ---- Local view state ----
  let viewportSize = $state<'desktop' | 'tablet' | 'mobile'>('desktop');
  let copySuccess = $state(false);
  let activeTab = $state<'code' | 'preview'>('code');
  let isEditable = $state(false);
  let editedCode = $state('');
  let originalCode = $state('');
  let previewKey = $state(0);
  let previewContent = $state('');
  let showSaveDialog = $state(false);
  let newPrompt = $state('');
  let isDesktop = $state(false);

  onMount(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    isDesktop = mq.matches;
    const handler = (e: MediaQueryListEvent) => {
      isDesktop = e.matches;
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  });

  const hasChanges = $derived(editedCode !== originalCode);

  // ---- Debounced preview update ----
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let lastUpdateTime = 0;

  onDestroy(() => {
    clearTimeout(debounceTimer);
  });

  function flushPreview(code: string) {
    clearTimeout(debounceTimer);
    previewContent = prepareHtmlContent(code);
    lastUpdateTime = Date.now();
  }

  function syncGeneratedCode(code: string) {
    editedCode = code;
    originalCode = code;

    if (!code) {
      lastUpdateTime = 0;
      flushPreview(code);
      return;
    }

    const now = Date.now();
    
    // Immediate First Frame
    if (lastUpdateTime === 0) {
      flushPreview(code);
      return;
    }

    // Throttle during generation
    if (now - lastUpdateTime >= 1000) {
      flushPreview(code);
      return;
    }

    // Debounce for final chunk
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      flushPreview(code);
    }, 1000);
  }

  // When new generated code arrives, reset edit buffers and refresh preview
  $effect(() => {
    const code = generatedCode;
    const generating = isGenerating;

    if (generating && !code) {
      editedCode = '';
      originalCode = '';
      lastUpdateTime = 0;
      flushPreview('');
      return;
    }

    if (code) {
      syncGeneratedCode(code);
    }
  });

  // Force a final flush when generation completes to remove fast-forward styles
  $effect(() => {
    if (!isGenerating && generatedCode) {
      flushPreview(generatedCode);
    }
  });

  const providerLabel = $derived(
    provider === 'deepseek'
      ? 'DEEPSEEK'
      : provider === 'openai_compatible'
        ? 'CUSTOM API'
        : provider === 'ollama'
          ? 'OLLAMA'
          : provider === 'lm_studio'
            ? 'LM STUDIO'
            : 'AI'
  );

  function saveChanges() {
    originalCode = editedCode;
  }

  function copyToClipboard() {
    const currentCode = isEditable ? editedCode : originalCode;
    navigator.clipboard
      .writeText(currentCode)
      .then(() => {
        copySuccess = true;
        setTimeout(() => (copySuccess = false), 2000);
      })
      .catch((err) => {
        console.error('Error copying:', err);
        toast.error('Failed to copy to clipboard');
      });
  }

  function refreshPreview() {
    const currentCode = isEditable ? editedCode : originalCode;
    flushPreview(currentCode);
    previewKey += 1;
  }

  function downloadCode() {
    const currentCode = isEditable ? editedCode : originalCode;
    const element = document.createElement('a');
    const file = new Blob([currentCode], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = 'generated-website.html';
    document.body.appendChild(element);
    element.click();
    URL.revokeObjectURL(element.href);
    document.body.removeChild(element);
  }

  function handleSendNewPrompt() {
    if (!newPrompt.trim() || isGenerating) return;
    onRegenerateWithNewPrompt(newPrompt);
    newPrompt = '';
  }

  // Props shared with the CodePanel
  const codePanelHandlers = {
    setEditable: (value: boolean) => (isEditable = value),
    onEditedCodeChange: (value: string) => {
      editedCode = value;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        flushPreview(value);
      }, 500);
    },
    onNewPromptChange: (value: string) => (newPrompt = value),
    requestSaveDialog: () => (showSaveDialog = true)
  };
</script>

<div class="flex h-screen flex-col overflow-hidden bg-black text-white">
  <!-- Header -->
  <header class="border-b border-gray-800 px-4 py-2">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <h1 class="text-lg font-bold text-white">{providerLabel}</h1>
        <Badge variant="outline" class="border-white bg-gray-900 text-white">{model}</Badge>
        {#if thinkingOutput || isThinking}
          <div class="ml-2">
            <ThinkingIndicator {thinkingOutput} {isThinking} position="top-left" />
          </div>
        {/if}
      </div>
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          class="h-8 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white"
          disabled={isGenerating}
          onclick={onRestart}
        >
          <RefreshCw class="mr-1 h-4 w-4" />
          <span class="hidden sm:inline">Restart</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="h-8 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white"
          disabled={!generatedCode || isGenerating}
          onclick={downloadCode}
        >
          <Download class="mr-1 h-4 w-4" />
          <span class="hidden sm:inline">Export</span>
        </Button>
      </div>
    </div>
  </header>

  <!-- Mobile Tab Navigation -->
  <div class="flex border-b border-gray-800 bg-gray-900/50 md:hidden">
    <button
      class="flex-1 py-2 text-sm font-medium {activeTab === 'code'
        ? 'border-b-2 border-white text-white'
        : 'text-gray-400'}"
      onclick={() => (activeTab = 'code')}
    >
      CODE
    </button>
    <button
      class="flex-1 py-2 text-sm font-medium {activeTab === 'preview'
        ? 'border-b-2 border-white text-white'
        : 'text-gray-400'}"
      onclick={() => (activeTab = 'preview')}
    >
      PREVIEW
    </button>
  </div>

  <!-- Main content -->
  <div class="flex flex-1 overflow-hidden">
    {#if isDesktop}
      <!-- Desktop View - Resizable Panels -->
      <div class="h-full w-full">
        <PaneGroup direction="horizontal" class="h-full w-full">
          <Pane defaultSize={65} minSize={30}>
            <CodePanel
              {isGenerating}
              {generationComplete}
              {isEditable}
              {hasChanges}
              {copySuccess}
              {generatedCode}
              {editedCode}
              {originalCode}
              previousPrompt={prompt}
              {newPrompt}
              {saveChanges}
              {copyToClipboard}
              {handleSendNewPrompt}
              {...codePanelHandlers}
            />
          </Pane>
          <PaneResizer
            class="relative flex w-px items-center justify-center bg-gray-800 hover:bg-gray-700"
          >
            <div class="z-10 flex h-7 w-1.5 items-center justify-center rounded-sm bg-gray-700"></div>
          </PaneResizer>
          <Pane defaultSize={35} minSize={25}>
            <PreviewPanel
              {generationComplete}
              {viewportSize}
              {originalCode}
              {editedCode}
              {isGenerating}
              {previewKey}
              {previewContent}
              {refreshPreview}
              setViewportSize={(size) => (viewportSize = size)}
            />
          </Pane>
        </PaneGroup>
      </div>
    {:else}
      <!-- Mobile View -->
      <div class="flex h-full w-full flex-col">
        {#if activeTab === 'code'}
          <div class="flex h-full flex-col">
            <CodePanel
              {isGenerating}
              {generationComplete}
              {isEditable}
              {hasChanges}
              {copySuccess}
              {generatedCode}
              {editedCode}
              {originalCode}
              previousPrompt={prompt}
              {newPrompt}
              {saveChanges}
              {copyToClipboard}
              {handleSendNewPrompt}
              {...codePanelHandlers}
            />
          </div>
        {:else}
          <div class="flex h-full flex-col">
            <PreviewPanel
              {generationComplete}
              {viewportSize}
              {originalCode}
              {editedCode}
              {isGenerating}
              {previewKey}
              {previewContent}
              {refreshPreview}
              setViewportSize={(size) => (viewportSize = size)}
            />
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Save Dialog -->
  <Dialog bind:open={showSaveDialog}>
    <h3 class="text-lg font-semibold">Save changes?</h3>
    <p class="mt-2 text-sm text-gray-400">
      Do you want to save your changes before switching to read-only mode?
    </p>
    <div class="mt-4 flex justify-end gap-2">
      <Button
        variant="outline"
        class="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
        onclick={() => {
          editedCode = originalCode;
          flushPreview(originalCode);
          isEditable = false;
          showSaveDialog = false;
        }}
      >
        Don't save
      </Button>
      <Button
        class="bg-blue-600 text-white hover:bg-blue-700"
        onclick={() => {
          saveChanges();
          isEditable = false;
          showSaveDialog = false;
        }}
      >
        Save
      </Button>
    </div>
  </Dialog>
</div>
