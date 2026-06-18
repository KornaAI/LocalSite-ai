<script lang="ts">
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import { Loader2 } from '@lucide/svelte';
  import Select, { type SelectItem } from '$lib/components/ui/Select.svelte';

  interface Provider {
    id: string;
    name: string;
    description: string;
    isLocal: boolean;
    examples?: string[];
  }

  interface Props {
    selectedProvider: string;
    onProviderChange?: () => void;
  }

  let { selectedProvider = $bindable(''), onProviderChange }: Props = $props();

  let providers = $state<Provider[]>([]);
  let isLoading = $state(false);

  const items = $derived<SelectItem[]>(
    providers.map((p) => ({
      value: p.id,
      label: p.name,
      description: p.description,
      examples: p.examples
    }))
  );

  onMount(async () => {
    isLoading = true;
    try {
      const response = await fetch('/api/get-models', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Error fetching providers');
      }
      const data: Provider[] = await response.json();
      providers = data;

      // If no provider is selected, get the default provider
      if (!selectedProvider && data.length > 0) {
        try {
          const defaultResponse = await fetch('/api/get-default-provider');
          if (defaultResponse.ok) {
            const { defaultProvider } = await defaultResponse.json();
            const providerExists = data.some((p) => p.id === defaultProvider);
            selectedProvider = providerExists ? defaultProvider : data[0].id;
          } else {
            selectedProvider = data[0].id;
          }
        } catch (error) {
          console.error('Error fetching default provider:', error);
          selectedProvider = data[0].id;
        }
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast.error('Providers could not be loaded.');
    } finally {
      isLoading = false;
    }
  });

  function handleChange(value: string) {
    selectedProvider = value;
    onProviderChange?.();
  }
</script>

<div class="mb-6 w-full">
  <label for="provider-select" class="mb-2 block text-sm font-medium text-gray-300">
    SELECT PROVIDER
  </label>
  {#if isLoading}
    <div
      class="flex h-10 items-center justify-center rounded-md border border-gray-800 bg-gray-900/80 text-sm text-white"
    >
      <Loader2 class="mr-2 h-4 w-4 animate-spin" />
      <span>Loading providers...</span>
    </div>
  {:else}
    <Select
      id="provider-select"
      value={selectedProvider}
      {items}
      placeholder="Choose an AI provider..."
      emptyText="No providers available"
      onValueChange={handleChange}
    />
  {/if}
</div>
