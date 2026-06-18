<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  interface Props {
    class?: string;
    ariaLabel?: string;
    children?: Snippet;
  }

  let { class: className = '', ariaLabel = 'Scrollable content', children }: Props = $props();
</script>

<div
  role="region"
  aria-label={ariaLabel}
  class={cn('relative overflow-auto', className)}
>
  {@render children?.()}
</div>
