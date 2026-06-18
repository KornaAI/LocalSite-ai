import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  getAvailableProviders,
  isProviderConfigured,
  resolveDefaultProvider,
} from "$lib/server/providers/config";

export const GET: RequestHandler = async () => {
  try {
    let defaultProvider = resolveDefaultProvider();

    if (!isProviderConfigured(defaultProvider)) {
      const available = getAvailableProviders();
      if (available.length > 0) {
        defaultProvider = available[0].id;
      }
    }

    return json({ defaultProvider });
  } catch (error) {
    console.error("Error fetching default provider:", error);

    return json({ error: "Error fetching default provider" }, { status: 500 });
  }
};
