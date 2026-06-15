<script lang="ts">
  import { Copy, Loader2, Save, ArrowRight } from '@lucide/svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Switch from '$lib/components/ui/Switch.svelte';
  import Textarea from '$lib/components/ui/Textarea.svelte';
  import ScrollArea from '$lib/components/ui/ScrollArea.svelte';
  import CodeEditor from '$lib/components/CodeEditor.svelte';
  import WorkSteps from '$lib/components/WorkSteps.svelte';

  interface Props {
    isGenerating: boolean;
    generationComplete: boolean;
    isEditable: boolean;
    hasChanges: boolean;
    copySuccess: boolean;
    generatedCode: string;
    editedCode: string;
    originalCode: string;
    previousPrompt: string;
    newPrompt: string;
    setEditable: (value: boolean) => void;
    saveChanges: () => void;
    copyToClipboard: () => void;
    onEditedCodeChange: (value: string) => void;
    onNewPromptChange: (value: string) => void;
    handleSendNewPrompt: () => void;
    requestSaveDialog: () => void;
  }

  let {
    isGenerating,
    generationComplete,
    isEditable,
    hasChanges,
    copySuccess,
    generatedCode,
    editedCode,
    originalCode,
    previousPrompt,
    newPrompt,
    setEditable,
    saveChanges,
    copyToClipboard,
    onEditedCodeChange,
    onNewPromptChange,
    handleSendNewPrompt,
    requestSaveDialog
  }: Props = $props();

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendNewPrompt();
    }
  }

  function onToggle(checked: boolean) {
    if (!checked && hasChanges) {
      requestSaveDialog();
    } else {
      setEditable(checked);
    }
  }
</script>

<div class="flex h-full flex-col">
  <!-- CODE EDITOR SECTION (65% height) -->
  <div class="flex h-[65%] flex-col border-b border-gray-800">
    <!-- Editor Toolbar -->
    <div class="flex items-center justify-between border-b border-gray-800 bg-gray-900/50 p-2">
      <div class="flex items-center gap-2">
        <h2 class="text-sm font-medium">GENERATED HTML</h2>
        {#if generationComplete}
          <div class="ml-3 flex items-center space-x-2">
            <span class="text-xs text-gray-400">{isEditable ? 'Edit' : 'Read Only'}</span>
            <Switch checked={isEditable} disabled={isGenerating} onCheckedChange={onToggle} />
          </div>
        {/if}
      </div>

      <div class="flex items-center gap-2">
        {#if isEditable && hasChanges}
          <Button
            variant="ghost"
            size="sm"
            class="h-7 px-2 text-green-500 hover:bg-green-900/20 hover:text-green-400"
            onclick={saveChanges}
          >
            <Save class="mr-1 h-4 w-4" />
            Save
          </Button>
        {/if}
        <Button
          variant="ghost"
          size="sm"
          class="h-7 px-2 text-gray-400 hover:text-white"
          onclick={copyToClipboard}
          disabled={!generatedCode || isGenerating}
        >
          <Copy class="mr-1 h-4 w-4" />
          {copySuccess ? 'Copied!' : 'Copy'}
        </Button>
      </div>
    </div>

    <!-- Editor Content Area -->
    <div class="flex-1 overflow-hidden">
      {#if isGenerating && !generatedCode}
        <div class="flex h-full w-full items-center justify-center bg-gray-950">
          <div class="text-center">
            <Loader2 class="mx-auto mb-4 h-8 w-8 animate-spin text-white" />
            <p class="text-gray-400">Generating code...</p>
          </div>
        </div>
      {:else}
        <CodeEditor
          code={isEditable ? editedCode : originalCode}
          isEditable={isEditable && generationComplete}
          onChange={onEditedCodeChange}
        />
      {/if}
    </div>
  </div>

  <!-- BOTTOM SECTION (35% height) -->
  <div class="flex h-[35%] flex-col overflow-hidden p-3">
    <!-- New Prompt Input -->
    <div class="mb-2 flex-shrink-0">
      <h3 class="mb-1 text-xs font-medium text-gray-400">NEW PROMPT</h3>
      <div class="relative">
        <Textarea
          value={newPrompt}
          oninput={(e) => onNewPromptChange((e.target as HTMLTextAreaElement).value)}
          placeholder="Enter a new prompt..."
          class="min-h-[60px] w-full rounded-md border border-gray-800 bg-gray-900/50 p-2 pr-10 text-sm text-gray-300 focus-visible:border-white focus-visible:ring-white"
          onkeydown={handleKeyDown}
          disabled={isGenerating}
        />
        <Button
          size="sm"
          class="absolute bottom-2 right-2 h-6 w-6 p-0 {newPrompt.trim()
            ? 'bg-gray-700 hover:bg-gray-600'
            : 'bg-gray-800 hover:bg-gray-700'}"
          onclick={handleSendNewPrompt}
          disabled={!newPrompt.trim() || isGenerating}
        >
          <ArrowRight class="h-3 w-3 {newPrompt.trim() ? 'text-white' : 'text-gray-400'}" />
          <span class="sr-only">Send</span>
        </Button>
      </div>

      {#if previousPrompt}
        <div class="mt-2">
          <h4 class="text-xs font-medium text-gray-400">PREVIOUS PROMPT:</h4>
          <ScrollArea class="mt-1 h-12 w-full rounded-md border border-gray-800 bg-gray-900/30 p-2">
            <p class="text-xs text-gray-400">{previousPrompt}</p>
          </ScrollArea>
        </div>
      {/if}
    </div>

    <!-- Work Steps Visualization -->
    <div class="flex-1 overflow-hidden">
      <h3 class="mb-1 text-xs font-medium text-gray-400">AI WORK STEPS</h3>
      <div class="h-[calc(100%-20px)] overflow-hidden">
        <WorkSteps
          {isGenerating}
          {generationComplete}
          generatedCode={isEditable ? editedCode : generatedCode}
        />
      </div>
    </div>
  </div>
</div>
