<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  interface Props {
    variant?: 'default' | 'outline' | 'secondary';
    class?: string;
    children?: Snippet;
  }

  let { variant = 'default', class: className = '', children }: Props = $props();

  const variants = {
    default: 'border-transparent bg-primary text-primary-foreground',
    outline: 'text-foreground',
    secondary: 'border-transparent bg-secondary text-secondary-foreground'
  };
</script>

<div
  class={cn(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
    variants[variant],
    className
  )}
>
  {@render children?.()}
</div>
