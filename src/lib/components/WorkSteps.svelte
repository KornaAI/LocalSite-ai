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

  function hasHtmlTag(code: string, tag: string): boolean {
    return new RegExp(`<${tag}\\b`, 'i').test(code);
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
        hasHtmlTag(code, 'html') ||
        hasHtmlTag(code, 'body') ||
        hasHtmlTag(code, 'head') ||
        /<!doctype\s+html\b/i.test(code)
    },
    {
      id: 'content',
      label: 'Adding content...',
      detector: (code) => {
        const contentTags = [
          'div',
          'p',
          'h1',
          'h2',
          'h3',
          'span',
          'img',
          'ul',
          'ol',
          'section',
          'main',
          'article'
        ];
        const matchedTags = contentTags.filter((tag) => hasHtmlTag(code, tag));

        if (matchedTags.length >= 2) return true;
        if (matchedTags.length === 1) {
          const tag = matchedTags[0];
          return new RegExp(`<${tag}\\b[^>]*>[\\s\\S]+?</${tag}>`, 'i').test(code);
        }
        return false;
      }
    },
    {
      id: 'styles',
      label: 'Adding styles...',
      detector: (code) => {
        if (/<style\b/i.test(code)) return true;

        const hasClassAttr = /\bclass\s*=\s*["'][^"']+["']/i.test(code);
        const hasInlineStyle = /\bstyle\s*=\s*["'][^"']+["']/i.test(code);
        const hasStyledElement = /<[a-z][a-z0-9]*\b[^>]*(?:class|style)\s*=/i.test(code);

        return hasStyledElement && (hasClassAttr || hasInlineStyle);
      }
    },
    {
      id: 'javascript',
      label: 'Implementing JavaScript...',
      detector: (code, complete) => {
        const hasScriptTag = /<script\b/i.test(code);
        const jsSignals = [
          /\bfunction\s+\w+\s*\(/,
          /\bfunction\s*\(/,
          /\baddEventListener\s*\(/,
          /\bdocument\.\w+/,
          /\bwindow\.\w+/,
          /\bconst\s+\w+\s*=/,
          /\blet\s+\w+\s*=/,
          /\bvar\s+\w+\s*=/
        ].filter((pattern) => pattern.test(code)).length;

        if (!hasScriptTag && jsSignals < 2) return false;
        if (complete) return true;

        const scriptTagsCount = (code.match(/<script\b/gi) || []).length;
        const closingScriptTagsCount = (code.match(/<\/script>/gi) || []).length;

        return (
          scriptTagsCount === closingScriptTagsCount &&
          scriptTagsCount > 0 &&
          !/\b(function|const|let|var)\s*$/.test(code.trim()) &&
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
