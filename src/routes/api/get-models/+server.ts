import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { env } from "$env/dynamic/private";
import {
  getAvailableProviders,
  LLMProvider,
} from "$lib/server/providers/config";
import { createProviderClient } from "$lib/server/providers/provider";

// Endpoint to get the models for a provider
export const GET: RequestHandler = async ({ url }) => {
  try {
    const providerParam = url.searchParams.get("provider");

    let provider: LLMProvider;

    if (
      providerParam &&
      Object.values(LLMProvider).includes(providerParam as LLMProvider)
    ) {
      provider = providerParam as LLMProvider;
    } else {
      // Use the default provider from environment variables or DeepSeek as fallback
      provider = (env.DEFAULT_PROVIDER as LLMProvider) || LLMProvider.DEEPSEEK;
    }

    // Create the provider client
    const providerClient = createProviderClient(provider);

    // Get the available models
    const models = await providerClient.getModels();

    return json(models);
  } catch (error) {
    console.error("Error fetching models:", error);

    const errorMessage = error instanceof Error
      ? error.message
      : "Error fetching models";

    return json({ error: errorMessage }, { status: 500 });
  }
};

// Endpoint to get available providers
export const POST: RequestHandler = async () => {
  try {
    const providers = getAvailableProviders().map((provider) => ({
      id: provider.id,
      name: provider.name,
      description: provider.description,
      isLocal: provider.isLocal,
      examples: provider.examples,
    }));

    return json(providers);
  } catch (error) {
    console.error("Error fetching providers:", error);

    return json({ error: "Error fetching providers" }, { status: 500 });
  }
};
