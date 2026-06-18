<script lang="ts">
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import Textarea from '$lib/components/ui/Textarea.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import Combobox, { type ComboboxItem } from '$lib/components/ui/Combobox.svelte';
  import ProviderSelector from '$lib/components/ProviderSelector.svelte';

  interface Model {
    id: string;
    name: string;
  }

  interface Props {
    prompt: string;
    selectedModel: string;
    selectedProvider: string;
    selectedSystemPrompt: string;
    customSystemPrompt: string;
    maxTokens: number | undefined;
    onGenerate: () => void;
  }

  let {
    prompt = $bindable(''),
    selectedModel = $bindable(''),
    selectedProvider = $bindable(''),
    selectedSystemPrompt = $bindable('default'),
    customSystemPrompt = $bindable(''),
    maxTokens = $bindable<number | undefined>(undefined),
    onGenerate
  }: Props = $props();

  let titleClass = $state('pre-animation');
  let models = $state<Model[]>([]);
  let isLoadingModels = $state(false);

  const modelItems = $derived<ComboboxItem[]>(models.map((m) => ({ value: m.id, label: m.name })));

  const systemPromptItems = [
    { value: 'default', label: 'Default', description: 'Standard code generation' },
    { value: 'thinking', label: 'Thinking', description: 'Makes non thinking models think' },
    { value: 'custom', label: 'Custom System Prompt', description: 'Specify a custom System Prompt' }
  ];

  onMount(() => {
    const timer = setTimeout(() => (titleClass = 'typing-animation'), 100);
    return () => clearTimeout(timer);
  });

  // Load models when the provider changes
  $effect(() => {
    const provider = selectedProvider;
    if (!provider) return;

    // Check sessionStorage cache first
    const cacheKey = `models_${provider}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const cachedModels: Model[] = JSON.parse(cached);
        models = cachedModels;
        if (cachedModels.length > 0 && !selectedModel) {
          selectedModel = cachedModels[0].id;
        }
        return;
      } catch {
        sessionStorage.removeItem(cacheKey);
      }
    }

    let cancelled = false;
    (async () => {
      isLoadingModels = true;
      selectedModel = '';
      models = [];

      try {
        const response = await fetch(`/api/get-models?provider=${provider}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || 'Error fetching models');
        }

        if (cancelled) return;

        sessionStorage.setItem(cacheKey, JSON.stringify(data));
        models = data;
        if (data.length > 0) selectedModel = data[0].id;
      } catch (error) {
        if (cancelled) return;
        console.error('Error fetching models:', error);
        models = [];
        selectedModel = '';

        if (error instanceof Error) {
          const msg = error.message;
          if (msg.includes('Ollama')) {
            toast.error('Cannot connect to Ollama. Is the server running?');
          } else if (msg.includes('LM Studio')) {
            toast.error('Cannot connect to LM Studio. Is the server running?');
          } else if (provider === 'deepseek' || provider === 'openai_compatible') {
            toast.error('Make sure the Base URL and API Keys are correct in your .env.local file.');
          } else {
            toast.error('Models could not be loaded. Please try again later.');
          }
        } else {
          toast.error('Models could not be loaded. Please try again later.');
        }
      } finally {
        if (!cancelled) isLoadingModels = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  });

  function handleProviderChange() {
    selectedModel = '';
  }

  function handleGenerateClick() {
    if (selectedSystemPrompt === 'custom' && !customSystemPrompt.trim()) {
      toast.error('Please enter a custom system prompt.');
      return;
    }
    onGenerate();
  }

  function onMaxTokensInput(event: Event) {
    const raw = (event.target as HTMLInputElement).value;
    const value = raw ? parseInt(raw, 10) : undefined;
    maxTokens = value && !isNaN(value) && value > 0 ? value : undefined;
  }
</script>

<div
  class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black p-4"
>
  <!-- Animated background -->
  <div
    class="animate-pulse-slow absolute inset-0 z-0 bg-gradient-to-br from-black via-gray-900 to-black"
  ></div>

  <!-- Content -->
  <div class="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center">
    <h1
      class="mb-12 text-4xl font-bold tracking-wider text-white md:text-6xl {titleClass}"
      style="font-family: 'Space Mono', monospace"
    >
      WHAT ARE WE BUILDING?
    </h1>

    <div class="relative mb-6 w-full">
      <Textarea
        bind:value={prompt}
        placeholder="Describe the website you want to create..."
        class="min-h-[150px] w-full border-gray-800 bg-gray-900/80 pr-[120px] text-white placeholder:text-gray-500 transition-all duration-300 focus-visible:border-white focus-visible:ring-white"
      />
      <Button
        onclick={handleGenerateClick}
        disabled={!prompt.trim() || !selectedModel || (selectedSystemPrompt === 'custom' && !customSystemPrompt.trim())}
        class="absolute bottom-4 right-4 rounded-md border border-gray-800 bg-gray-900/90 px-12 py-3 text-base font-medium tracking-wider text-white transition-all duration-300 hover:border-gray-700 hover:bg-gray-800"
      >
        GENERATE
      </Button>
    </div>

    <ProviderSelector bind:selectedProvider onProviderChange={handleProviderChange} />

    <div class="mb-4 w-full">
      <label for="model-combobox" class="mb-2 block text-sm font-medium text-gray-300">
        SELECT MODEL
      </label>
      <Combobox
        bind:value={selectedModel}
        items={modelItems}
        loading={isLoadingModels}
        disabled={!selectedProvider || isLoadingModels}
        loadingText="Loading models..."
        placeholder={selectedProvider ? 'Choose a model...' : 'Select a provider first'}
      />
    </div>

    <div class="mb-4 w-full">
      <label for="system-prompt-select" class="mb-2 block text-sm font-medium text-gray-300">
        SYSTEM PROMPTS
      </label>
      <Select bind:value={selectedSystemPrompt} items={systemPromptItems} />
    </div>

    {#if selectedSystemPrompt === 'custom'}
      <div class="mb-4 w-full">
        <label for="custom-prompt" class="mb-2 block text-sm font-medium text-gray-300">
          CUSTOM SYSTEM PROMPT
        </label>
        <Textarea
          bind:value={customSystemPrompt}
          placeholder="Enter a custom system prompt to override the default..."
          class="min-h-[100px] w-full border-gray-800 bg-gray-900/80 text-white placeholder:text-gray-500 transition-all duration-300 focus-visible:border-white focus-visible:ring-white"
        />
        <p class="mt-1 text-xs text-gray-400">
          Your custom prompt will be used for this generation and subsequent regenerations.
        </p>
      </div>
    {/if}

    <div class="mb-8 w-full">
      <label for="max-tokens" class="mb-2 block text-sm font-medium text-gray-300">
        MAX OUTPUT TOKENS
      </label>
      <div class="flex items-center gap-4">
        <Input
          id="max-tokens"
          type="number"
          value={maxTokens ?? ''}
          oninput={onMaxTokensInput}
          placeholder="Default (model dependent)"
          class="w-full border-gray-800 bg-gray-900/80 text-white placeholder:text-gray-500 transition-all duration-300 focus-visible:border-white focus-visible:ring-white"
          min="100"
          step="100"
        />
        <Button
          variant="outline"
          onclick={() => (maxTokens = undefined)}
          class="border-gray-800 text-gray-300 hover:bg-gray-800"
        >
          Reset
        </Button>
      </div>
      <p class="mt-1 text-xs text-gray-400">
        Set the maximum number of tokens for the model output. Higher values allow for longer code
        generation but may take more time. Leave empty to use the model's default.
      </p>
    </div>
  </div>
</div>
