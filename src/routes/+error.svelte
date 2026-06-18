<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';

  let { error, status }: { error: Error & { message?: string }; status: number } = $props();
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-white">
  <div class="max-w-md text-center">
    <p class="mb-2 text-sm font-medium uppercase tracking-wider text-gray-500">Error {status}</p>
    <h1 class="mb-4 text-3xl font-bold">Something went wrong</h1>
    <p class="mb-8 text-gray-400">{error?.message ?? 'An unexpected error occurred.'}</p>
    <Button
      onclick={() => (window.location.href = '/')}
      class="border border-gray-800 bg-gray-900 px-6 py-2 text-white hover:bg-gray-800"
    >
      Back to Home
    </Button>
  </div>
</div>
