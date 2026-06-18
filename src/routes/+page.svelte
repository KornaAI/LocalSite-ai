<script lang="ts">
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import LoadingScreen from '$lib/components/LoadingScreen.svelte';
  import WelcomeView from '$lib/components/WelcomeView.svelte';
  import GenerationView from '$lib/components/GenerationView.svelte';
  import { CodeGeneration } from '$lib/state/code-generation.svelte';

  let isLoading = $state(true);
  let showGenerationView = $state(false);

  let prompt = $state('');
  let selectedProvider = $state('');
  let selectedModel = $state('');
  let selectedSystemPrompt = $state('default');
  let customSystemPrompt = $state('');
  let maxTokens = $state<number | undefined>(undefined);

  const gen = new CodeGeneration();

  onMount(() => {
    let cancelled = false;

    const fallback = setTimeout(() => {
      if (!cancelled) isLoading = false;
    }, 500);

    void document.fonts.ready.then(() => {
      if (!cancelled) isLoading = false;
    });

    return () => {
      cancelled = true;
      clearTimeout(fallback);
    };
  });

  function validateGenerationInput(): boolean {
    if (!prompt.trim() || !selectedModel || !selectedProvider) {
      toast.error('Please enter a prompt and select a provider and model.');
      return false;
    }
    if (selectedSystemPrompt === 'custom' && !customSystemPrompt.trim()) {
      toast.error('Please enter a custom system prompt.');
      return false;
    }
    return true;
  }

  async function handleGenerate() {
    if (!validateGenerationInput()) return;

    showGenerationView = true;
    await gen.generateCode({
      prompt,
      model: selectedModel,
      provider: selectedProvider,
      maxTokens,
      systemPromptType: selectedSystemPrompt,
      customSystemPrompt
    });
  }

  async function handleRegenerateWithNewPrompt(newPrompt: string) {
    prompt = newPrompt;
    await gen.generateCode({
      prompt: newPrompt,
      model: selectedModel,
      provider: selectedProvider,
      maxTokens,
      systemPromptType: selectedSystemPrompt,
      customSystemPrompt
    });
  }

  function handleRestart() {
    gen.reset();
    showGenerationView = false;
  }
</script>

{#if isLoading}
  <LoadingScreen />
{:else if showGenerationView}
  <GenerationView
    {prompt}
    model={selectedModel}
    provider={selectedProvider}
    generatedCode={gen.generatedCode}
    isGenerating={gen.isGenerating}
    generationComplete={gen.generationComplete}
    thinkingOutput={gen.thinkingOutput}
    isThinking={gen.isThinking}
    onRegenerateWithNewPrompt={handleRegenerateWithNewPrompt}
    onRestart={handleRestart}
  />
{:else}
  <WelcomeView
    bind:prompt
    bind:selectedModel
    bind:selectedProvider
    bind:selectedSystemPrompt
    bind:customSystemPrompt
    bind:maxTokens
    onGenerate={handleGenerate}
  />
{/if}
