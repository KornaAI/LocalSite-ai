<script lang="ts">
  import { CheckCircle, Circle, Loader2 } from '@lucide/svelte';

  interface Props {
    isGenerating: boolean;
    generationComplete: boolean;
    generatedCode?: string;
  }

  let { isGenerating, generationComplete, generatedCode = '' }: Props = $props();

  interface StepDefinition {
    id: string;
    label: string;
    detector: (code: string, generationComplete: boolean) => boolean;
  }

  const STEP_DEFINITIONS: StepDefinition[] = [
    {
      id: 'init',
      label: 'Initializing model...',
      detector: () => true
    },
    {
      id: 'html_structure',
      label: 'Generating HTML structure...',
      detector: (code) =>
        code.includes('<html') || code.includes('<body') || code.includes('<head')
    },
    {
      id: 'content',
      label: 'Adding content...',
      detector: (code) =>
        code.includes('<div') ||
        code.includes('<p') ||
        code.includes('<h1') ||
        code.includes('<span') ||
        code.includes('<img') ||
        code.includes('<ul') ||
        code.includes('<section')
    },
    {
      id: 'styles',
      label: 'Adding styles...',
      detector: (code) =>
        code.includes('<style') || code.includes('class=') || code.includes('style=')
    },
    {
      id: 'javascript',
      label: 'Implementing JavaScript...',
      detector: (code, complete) => {
        const hasJavaScript =
          code.includes('<script') ||
          code.includes('function') ||
          code.includes('addEventListener') ||
          code.includes('document.') ||
          code.includes('window.') ||
          code.includes('const ') ||
          code.includes('let ') ||
          code.includes('var ');

        if (!hasJavaScript) return false;
        if (complete) return true;

        const scriptTagsCount = (code.match(/<script/g) || []).length;
        const closingScriptTagsCount = (code.match(/<\/script>/g) || []).length;

        return (
          scriptTagsCount === closingScriptTagsCount &&
          !code.trim().endsWith('function') &&
          !code.trim().endsWith('{') &&
          !code.trim().endsWith(';')
        );
      }
    },
    {
      id: 'finalize',
      label: 'Finalizing...',
      detector: (_code, complete) => complete
    }
  ];

  const steps = $derived.by(() => {
    if (generationComplete) {
      return STEP_DEFINITIONS.map((def) => ({ id: def.id, label: def.label, completed: true }));
    }
    if (!generatedCode) {
      return STEP_DEFINITIONS.map((def) => ({ id: def.id, label: def.label, completed: false }));
    }
    return STEP_DEFINITIONS.map((def) => ({
      id: def.id,
      label: def.label,
      completed: def.detector(generatedCode, generationComplete)
    }));
  });

  const currentStepIndex = $derived(steps.findIndex((step) => !step.completed));
</script>

<div class="h-full space-y-1.5 overflow-y-auto">
  {#each steps as step, index (step.id)}
    {@const isCompleted = step.completed}
    {@const isCurrent =
      !isCompleted && (currentStepIndex === -1 || index === currentStepIndex)}
    <div class="flex items-center gap-1.5">
      {#if isCompleted}
        <CheckCircle class="h-4 w-4 shrink-0 text-green-500" />
      {:else if isCurrent && isGenerating}
        <Loader2 class="h-4 w-4 shrink-0 animate-spin text-blue-400" />
      {:else}
        <Circle class="h-4 w-4 shrink-0 text-gray-600" />
      {/if}
      <span
        class="text-xs sm:text-sm {isCompleted
          ? 'text-gray-300'
          : isCurrent
            ? 'font-medium text-white'
            : 'text-gray-600'}"
      >
        {step.label}
      </span>
    </div>
  {/each}
</div>
