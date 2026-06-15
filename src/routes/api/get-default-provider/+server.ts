import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { env } from "$env/dynamic/private";
import { LLMProvider } from "$lib/server/providers/config";

export const GET: RequestHandler = async () => {
  try {
    // Use the default provider from environment variables or DeepSeek as fallback
    const defaultProvider = (env.DEFAULT_PROVIDER as LLMProvider) ||
      LLMProvider.DEEPSEEK;

    return json({ defaultProvider });
  } catch (error) {
    console.error("Error fetching default provider:", error);

    return json({ error: "Error fetching default provider" }, { status: 500 });
  }
};
