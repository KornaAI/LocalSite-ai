<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type * as Monaco from 'monaco-editor';

  interface Props {
    code: string;
    isEditable?: boolean;
    onChange?: (value: string) => void;
  }

  let { code, isEditable = false, onChange }: Props = $props();

  let container = $state<HTMLDivElement>();
  let editor: Monaco.editor.IStandaloneCodeEditor | null = null;
  let monaco: typeof Monaco | null = null;
  let isInitialMount = true;
  let isUserEditing = false;
  let suppressChange = false;

  onMount(() => {
    let disposed = false;

    (async () => {
      // Configure Monaco's web workers for Vite (ESM)
      const [monacoMod, EditorWorker] = await Promise.all([
        import('monaco-editor'),
        import('monaco-editor/esm/vs/editor/editor.worker?worker')
      ]);

      if (disposed) return;
      monaco = monacoMod;

      self.MonacoEnvironment = {
        getWorker: () => new EditorWorker.default()
      };

      if (!container) return;

      editor = monaco.editor.create(container, {
        value: code,
        language: 'html',
        theme: 'vs-dark',
        readOnly: !isEditable,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        wordWrap: 'on',
        automaticLayout: true
      });

      // Scroll to the end on initial load
      const model = editor.getModel();
      if (isInitialMount && model) {
        editor.revealLine(model.getLineCount());
        isInitialMount = false;
      }

      editor.onDidChangeCursorPosition(() => {
        if (isEditable) isUserEditing = true;
      });

      editor.onDidChangeModelContent(() => {
        if (suppressChange) return;
        const value = editor?.getValue();
        if (onChange && value !== undefined) onChange(value);
      });
    })();

    return () => {
      disposed = true;
    };
  });

  onDestroy(() => {
    editor?.dispose();
  });

  // Sync external `code` changes into the editor without firing onChange
  $effect(() => {
    const next = code;
    if (editor && editor.getValue() !== next) {
      suppressChange = true;
      editor.setValue(next);
      suppressChange = false;

      const model = editor.getModel();
      if (!isUserEditing && !isEditable && model) {
        editor.revealLine(model.getLineCount());
      }
    }
  });

  // Reflect readOnly + reset editing flag when edit mode changes
  $effect(() => {
    editor?.updateOptions({ readOnly: !isEditable });
    if (!isEditable) isUserEditing = false;
  });
</script>

<div class="h-full w-full overflow-hidden" bind:this={container}></div>
