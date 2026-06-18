<script lang="ts">
  import { onMount } from 'svelte';

  let glitchClass = $state('');

  onMount(() => {
    let glitchTimeout: ReturnType<typeof setTimeout> | undefined;
    const glitchInterval = setInterval(() => {
      glitchClass = 'glitch';
      glitchTimeout = setTimeout(() => (glitchClass = ''), 200);
    }, 2000);

    return () => {
      clearInterval(glitchInterval);
      clearTimeout(glitchTimeout);
    };
  });
</script>

<div class="fixed inset-0 flex flex-col items-center justify-center bg-black">
  <h1
    class="mb-8 text-4xl font-bold tracking-wider text-white md:text-6xl {glitchClass}"
    style="font-family: 'Space Mono', monospace"
  >
    LOADING, PLEASE WAIT...
  </h1>

  <div class="relative flex h-24 w-24 items-center justify-center">
    <div class="h-20 w-20 animate-spin rounded-full border-4 border-gray-600 border-t-white"></div>
  </div>
</div>
