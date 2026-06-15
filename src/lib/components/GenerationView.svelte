<script lang="ts">
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
  }

  let {
    prompt,
    model,
    provider = 'deepseek',
    generatedCode,
    isGenerating,
    generationComplete,
    thinkingOutput = '',
    isThinking = false,
    onRegenerateWithNewPrompt
  }: Props = $props();

  const darkModeStyle = `
  <style>
    :root { color-scheme: dark; }
    html, body { background-color: #121212; color: #ffffff; min-height: 100%; }
    body { margin: 0; padding: 0; transition: background-color 0.2s ease; }
  </style>
`;

  function prepareHtmlContent(code: string): string {
    if (code.includes('<head>')) {
      return code.replace('<head>', `<head>${darkModeStyle}`);
    } else if (code.includes('<html>')) {
      return code.replace('<html>', `<html><head>${darkModeStyle}</head>`);
    }
    return `
      <!DOCTYPE html>
      <html>
        <head>${darkModeStyle}</head>
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

  const hasChanges = $derived(editedCode !== originalCode);

  // ---- Debounced preview update ----
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  function debouncedUpdatePreview(code: string) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      previewContent = prepareHtmlContent(code);
    }, 200);
  }
  function flushPreview(code: string) {
    clearTimeout(debounceTimer);
    previewContent = prepareHtmlContent(code);
  }

  // When new generated code arrives, reset edit buffers and refresh preview
  $effect(() => {
    const code = generatedCode;
    editedCode = code;
    originalCode = code;
    if (code) debouncedUpdatePreview(code);
  });

  // Live-update the preview as the user edits
  $effect(() => {
    if (editedCode) debouncedUpdatePreview(editedCode);
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
      .catch((err) => console.error('Error copying:', err));
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
    onEditedCodeChange: (value: string) => (editedCode = value),
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
        {#if thinkingOutput}
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
          onclick={() => window.location.reload()}
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
    <!-- Mobile View -->
    <div class="flex h-full w-full flex-col md:hidden">
      <div class="h-full flex-col {activeTab === 'code' ? 'flex' : 'hidden'}">
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
      <div class="h-full flex-col {activeTab === 'preview' ? 'flex' : 'hidden'}">
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
    </div>

    <!-- Desktop View - Resizable Panels -->
    <div class="hidden h-full w-full md:block">
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
