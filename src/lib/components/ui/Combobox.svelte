<script lang="ts">
  import { ChevronsUpDown, Check, Loader2 } from '@lucide/svelte';
  import { tick } from 'svelte';
  import { cn } from '$lib/utils';

  export interface ComboboxItem {
    value: string;
    label: string;
  }

  interface Props {
    id?: string;
    value?: string;
    items: ComboboxItem[];
    disabled?: boolean;
    loading?: boolean;
    placeholder?: string;
    loadingText?: string;
    searchThreshold?: number;
    class?: string;
    onValueChange?: (value: string) => void;
  }

  let {
    id = 'model-combobox',
    value = $bindable(''),
    items,
    disabled = false,
    loading = false,
    placeholder = 'Choose...',
    loadingText = 'Loading...',
    searchThreshold = 10,
    class: className = '',
    onValueChange
  }: Props = $props();

  let open = $state(false);
  let search = $state('');
  let containerEl = $state<HTMLDivElement>();
  let searchEl = $state<HTMLInputElement>();

  const selectedLabel = $derived(items.find((i) => i.value === value)?.label ?? null);

  const filtered = $derived(
    search.trim()
      ? items.filter((item) =>
          `${item.label} ${item.value}`.toLowerCase().includes(search.toLowerCase())
        )
      : items
  );

  async function openMenu() {
    if (disabled) return;
    open = !open;
    if (open) {
      search = '';
      await tick();
      searchEl?.focus();
    }
  }

  function select(item: ComboboxItem) {
    value = item.value;
    onValueChange?.(item.value);
    open = false;
  }

  function onWindowClick(event: MouseEvent) {
    if (containerEl && !containerEl.contains(event.target as Node)) {
      open = false;
    }
  }
</script>

<svelte:window onclick={onWindowClick} />

<div class={cn('relative w-full', className)} bind:this={containerEl}>
  <button
    type="button"
    {id}
    role="combobox"
    aria-controls="combobox-listbox"
    aria-expanded={open}
    {disabled}
    onclick={openMenu}
    class="flex h-10 w-full items-center justify-between rounded-md border border-gray-800 bg-gray-900/80 px-3 py-2 text-sm font-normal text-white hover:bg-gray-900/80 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
    <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
  </button>

  {#if open}
    <div
      id="combobox-listbox"
      class="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-gray-800 bg-gray-900 text-white shadow-lg"
    >
      {#if items.length > searchThreshold}
        <div class="border-b border-gray-800 px-3">
          <input
            bind:this={searchEl}
            bind:value={search}
            placeholder="Search models..."
            class="h-10 w-full bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none"
          />
        </div>
      {/if}
      <div class="max-h-64 overflow-y-auto py-1">
        {#if filtered.length === 0}
          <div class="py-4 text-center text-sm text-gray-400">No models found</div>
        {:else}
          {#each filtered as item (item.value)}
            <button
              type="button"
              onclick={() => select(item)}
              class="flex w-full items-center px-3 py-1.5 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <Check
                class={cn(
                  'mr-2 h-4 w-4 shrink-0',
                  value === item.value ? 'opacity-100' : 'opacity-0'
                )}
              />
              <span class="truncate">{item.label}</span>
            </button>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>
