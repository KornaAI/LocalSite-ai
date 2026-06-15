<script lang="ts">
  import { Loader2, Brain, ChevronDown } from '@lucide/svelte';

  interface Props {
    thinkingOutput: string;
    isThinking: boolean;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  }

  let { thinkingOutput, isThinking, position = 'top-left' }: Props = $props();

  let isOpen = $state(false);
  let dots = $state('');
  let hasFinished = $state(false);
  let dropdownEl = $state<HTMLDivElement>();

  const dropdownPosition = $derived(
    position === 'top-right'
      ? 'right-0 top-full'
      : position === 'bottom-left'
        ? 'left-0 bottom-full'
        : position === 'bottom-right'
          ? 'right-0 bottom-full'
          : 'left-0 top-full'
  );

  const lines = $derived(thinkingOutput.split('\n'));

  // Animated dots for "Thinking..."
  $effect(() => {
    if (!isThinking) return;
    const interval = setInterval(() => {
      if (dots === '') dots = '.';
      else if (dots === '.') dots = '..';
      else if (dots === '..') dots = '...';
      else dots = '';
    }, 500);
    return () => clearInterval(interval);
  });

  // Track finished state
  $effect(() => {
    if (isThinking) {
      hasFinished = false;
    } else if (thinkingOutput && !hasFinished) {
      hasFinished = true;
    }
  });

  // Auto-scroll the dropdown to the bottom as output streams in
  $effect(() => {
    // reference thinkingOutput so this re-runs as it grows
    void thinkingOutput;
    if (isOpen && dropdownEl) {
      dropdownEl.scrollTop = dropdownEl.scrollHeight;
    }
  });
</script>

{#if thinkingOutput || isThinking}
  <div class="relative">
    <button
      type="button"
      class="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors {isOpen
        ? 'bg-gray-700 text-white'
        : 'text-gray-300 hover:bg-gray-800 hover:text-white'}"
      onclick={() => (isOpen = !isOpen)}
    >
      {#if isThinking}
        <div class="flex h-3 w-3 items-center justify-center">
          <Loader2 class="h-3 w-3 animate-spin" />
        </div>
      {:else}
        <Brain class="h-3 w-3 text-green-400" />
      {/if}
      <span class="min-w-[90px] transition-all duration-300">
        {#if isThinking}
          Thinking{dots}
        {:else if hasFinished}
          <span class="text-green-400 transition-all duration-300">Finished thinking</span>
        {:else}
          Thinking
        {/if}
      </span>
      <ChevronDown class="h-3 w-3 transition-transform {isOpen ? 'rotate-180' : ''}" />
    </button>

    {#if isOpen}
      <div
        bind:this={dropdownEl}
        class="absolute {dropdownPosition} z-50 mt-1 max-h-[300px] w-[400px] overflow-y-auto rounded-md border border-gray-800 bg-gray-900 p-3"
      >
        <h4 class="mb-2 text-xs font-medium text-gray-400">THINKING PROCESS:</h4>
        <div class="whitespace-pre-wrap font-mono text-xs text-gray-300">
          {#if thinkingOutput}
            {#each lines as line, i (i)}
              <div class="py-0.5">{line}</div>
            {/each}
          {:else}
            <div class="italic text-gray-500">Waiting for thinking output...</div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
{/if}
