import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  getAvailableProviders,
  parseLLMProvider,
  resolveDefaultProvider,
} from "$lib/server/providers/config";
import { createProviderClient } from "$lib/server/providers/provider";

export const GET: RequestHandler = async ({ url }) => {
  try {
    const providerParam = url.searchParams.get("provider");

    const provider = parseLLMProvider(providerParam) ?? resolveDefaultProvider();

    const providerClient = createProviderClient(provider);
    const models = await providerClient.getModels();

    return json(models);
  } catch (error) {
    console.error("Error fetching models:", error);

    return json(
      { error: "Generation failed. Check your configuration." },
      { status: 500 },
    );
  }
};

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
