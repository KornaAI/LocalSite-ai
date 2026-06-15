<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  interface Props {
    open?: boolean;
    class?: string;
    children?: Snippet;
    onOpenChange?: (open: boolean) => void;
  }

  let { open = $bindable(false), class: className = '', children, onOpenChange }: Props = $props();

  function close() {
    open = false;
    onOpenChange?.(false);
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') close();
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- backdrop -->
    <div
      class="absolute inset-0 bg-black/70"
      role="presentation"
      onclick={close}
    ></div>
    <div
      role="dialog"
      aria-modal="true"
      class={cn(
        'relative z-10 w-full max-w-lg rounded-lg border border-gray-800 bg-gray-900 p-6 text-white shadow-lg',
        className
      )}
    >
      {@render children?.()}
    </div>
  </div>
{/if}
