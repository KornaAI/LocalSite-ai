<script lang="ts">
  import { ChevronDown, Check, Loader2 } from '@lucide/svelte';
  import { cn } from '$lib/utils';

  export interface SelectItem {
    value: string;
    label: string;
    description?: string;
    examples?: string[];
  }

  interface Props {
    id?: string;
    value?: string;
    items: SelectItem[];
    placeholder?: string;
    disabled?: boolean;
    loading?: boolean;
    loadingText?: string;
    emptyText?: string;
    class?: string;
    onValueChange?: (value: string) => void;
  }

  let {
    id = 'system-prompt-select',
    value = $bindable(''),
    items,
    placeholder = 'Select...',
    disabled = false,
    loading = false,
    loadingText = 'Loading...',
    emptyText = 'No options available',
    class: className = '',
    onValueChange
  }: Props = $props();

  let open = $state(false);
  let triggerEl = $state<HTMLDivElement>();

  const selectedLabel = $derived(items.find((i) => i.value === value)?.label ?? null);

  function select(item: SelectItem) {
    value = item.value;
    onValueChange?.(item.value);
    open = false;
  }

  function onWindowClick(event: MouseEvent) {
    if (triggerEl && !triggerEl.contains(event.target as Node)) {
      open = false;
    }
  }
</script>

<svelte:window onclick={onWindowClick} />

<div class={cn('relative w-full', className)} bind:this={triggerEl}>
  <button
    type="button"
    {id}
    {disabled}
    aria-haspopup="listbox"
    aria-expanded={open}
    onclick={() => (open = !open)}
    class="flex h-10 w-full items-center justify-between rounded-md border border-gray-800 bg-gray-900/80 px-3 py-2 text-sm text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white disabled:cursor-not-allowed disabled:opacity-50"
  >
    {#if loading}
      <span class="flex items-center gap-2 text-gray-400">
        <Loader2 class="h-4 w-4 animate-spin" />
        {loadingText}
      </span>
    {:else if selectedLabel}
      <span class="truncate">{selectedLabel}</span>
    {:else}
      <span class="text-gray-500">{placeholder}</span>
    {/if}
    <ChevronDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
  </button>

  {#if open}
    <div
      role="listbox"
      class="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-gray-800 bg-gray-900 py-1 text-white shadow-lg"
    >
      {#if items.length === 0}
        <div class="p-2 text-sm text-gray-400">{emptyText}</div>
      {:else}
        {#each items as item (item.value)}
          <button
            type="button"
            role="option"
            aria-selected={value === item.value}
            onclick={() => select(item)}
            class="flex w-full items-start gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-800"
          >
            <Check
              class={cn('mt-0.5 h-4 w-4 shrink-0', value === item.value ? 'opacity-100' : 'opacity-0')}
            />
            <span class="flex flex-col">
              <span>{item.label}</span>
              {#if item.description}
                <span class="text-xs text-gray-400">{item.description}</span>
              {/if}
              {#if item.examples && item.examples.length > 0}
                <span class="mt-1 flex flex-wrap gap-1">
                  {#each item.examples as example (example)}
                    <span
                      class="inline-flex items-center rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-300"
                    >
                      {example}
                    </span>
                  {/each}
                </span>
              {/if}
            </span>
          </button>
        {/each}
      {/if}
    </div>
  {/if}
</div>
