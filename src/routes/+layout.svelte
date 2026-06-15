<script lang="ts">
  import '../app.css';
  import { Toaster } from 'svelte-sonner';

  let { children } = $props();
</script>

<svelte:head>
  <title>AI Code Generator</title>
  <meta name="description" content="Modern AI-powered code generation web app" />
</svelte:head>

<Toaster position="top-right" theme="dark" richColors />

{@render children?.()}
