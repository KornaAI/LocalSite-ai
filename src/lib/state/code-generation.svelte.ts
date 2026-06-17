import { toast } from "svelte-sonner";

export interface GenerateCodeParams {
  prompt: string;
  model: string;
  provider: string;
  maxTokens?: number;
  systemPromptType: string; // 'default', 'thinking', 'custom'
  customSystemPrompt?: string;
}

// Interface for NDJSON stream parts
interface StreamPart {
  type: "text" | "reasoning";
  content: string;
}

/**
 * Rune-based replacement for the former `useCodeGeneration` React hook.
 * Holds all generation state and the streaming logic.
 */
export class CodeGeneration {
  generatedCode = $state("");
  isGenerating = $state(false);
  generationComplete = $state(false);
  thinkingOutput = $state("");
  isThinking = $state(false);

  async generateCode({
    prompt,
    model,
    provider,
    maxTokens,
    systemPromptType,
    customSystemPrompt,
  }: GenerateCodeParams) {
    if (!prompt.trim() || !model || !provider) {
      toast.error("Please enter a prompt and select a provider and model.");
      return;
    }

    this.isGenerating = true;
    this.generatedCode = "";
    this.thinkingOutput = "";
    this.isThinking = false;
    this.generationComplete = false;

    try {
      // Construct the system prompt logic here or in the API route.
      let finalCustomSystemPrompt: string | null = null;

      if (systemPromptType === "custom") {
        finalCustomSystemPrompt = customSystemPrompt ?? null;
      }

      const response = await fetch("/api/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          model,
          provider,
          maxTokens,
          systemPromptType,
          customSystemPrompt: finalCustomSystemPrompt,
        }),
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            throw new Error(errorData.error);
          }
        } catch {
          // Ignore json parse error
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Stream could not be read");
      }

      const codeChunks: string[] = [];
      const reasoningChunks: string[] = [];
      let lineBuffer = "";
      let hasReceivedReasoning = false;
      const decoder = new TextDecoder();

      const stripFences = (s: string) => {
        return s
          .replace(/^[\s\S]*?```(?:[a-zA-Z0-9]+)?\s*\n/i, "")
          .replace(/\n\s*```[\s\S]*$/i, "");
      };

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        lineBuffer += decoder.decode(value, { stream: true });

        // Process complete lines (NDJSON format)
        const lines = lineBuffer.split("\n");
        // Keep the last incomplete line in the buffer
        lineBuffer = lines.pop() || "";

        let codeUpdated = false;
        let reasoningUpdated = false;

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const part: StreamPart = JSON.parse(line);

            if (part.type === "text") {
              if (this.isThinking) {
                this.isThinking = false;
              }
              codeChunks.push(part.content);
              codeUpdated = true;
            } else if (part.type === "reasoning") {
              if (!hasReceivedReasoning) {
                this.isThinking = true;
                hasReceivedReasoning = true;
              }
              reasoningChunks.push(part.content);
              reasoningUpdated = true;
            }
          } catch (parseError) {
            // If JSON parse fails, it might be legacy plain text format
            console.warn("Failed to parse stream part:", line, parseError);
          }
        }

        // Batch state updates once per reader.read() call
        if (codeUpdated) {
          this.generatedCode = stripFences(codeChunks.join(""));
        }
        if (reasoningUpdated) {
          this.thinkingOutput = reasoningChunks.join("");
        }
      }

      // Process any remaining content in the buffer
      if (lineBuffer.trim()) {
        try {
          const part: StreamPart = JSON.parse(lineBuffer);
          if (part.type === "text") {
            codeChunks.push(part.content);
            this.generatedCode = stripFences(codeChunks.join(""));
          } else if (part.type === "reasoning") {
            reasoningChunks.push(part.content);
            this.thinkingOutput = reasoningChunks.join("");
          }
        } catch {
          // Ignore parse errors for incomplete lines
        }
      }

      // End thinking state
      if (hasReceivedReasoning) {
        this.isThinking = false;
      }

      this.generationComplete = true;
    } catch (error) {
      console.error("Error generating code:", error);
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes("Ollama")) {
          toast.error("Cannot connect to Ollama. Is the server running?");
        } else if (errorMessage.includes("LM Studio")) {
          toast.error("Cannot connect to LM Studio. Is the server running?");
        } else if (
          provider === "deepseek" || provider === "openai_compatible"
        ) {
          toast.error(
            "Make sure the Base URL and API Keys are correct in your .env.local file.",
          );
        } else {
          toast.error(
            errorMessage || "Error generating code. Please try again later.",
          );
        }
      } else {
        toast.error("Error generating code. Please try again later.");
      }
    } finally {
      this.isGenerating = false;
    }
  }
}
