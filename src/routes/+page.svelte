<script lang="ts">
  import { onMount } from 'svelte';
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
    const timer = setTimeout(() => (isLoading = false), 1250);
    return () => clearTimeout(timer);
  });

  async function handleGenerate() {
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
