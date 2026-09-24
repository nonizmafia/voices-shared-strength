import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

export type CampaignTotal = {
  campaignSlug: string;
  currency: string;
  goalAmount: number;
  raisedAmount: number;
  updatedAt: string;
};

export const getCampaignTotal = createServerFn({ method: "GET" }).handler(
  async (): Promise<CampaignTotal> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];

    if (!url || !key) {
      throw new Error("The campaign total is temporarily unavailable.");
    }

    const client = createClient<Database>(url, key, {
      auth: { autoRefreshToken: false, persistSession: false, storage: undefined },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
            headers.delete("Authorization");
          }
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    });

    const { data, error } = await client
      .from("campaign_totals")
      .select("campaign_slug, currency, goal_amount, raised_amount, updated_at")
      .eq("campaign_slug", "vox-care")
      .single();

    if (error || !data) {
      throw new Error("The campaign total is temporarily unavailable.");
    }

    return {
      campaignSlug: data.campaign_slug,
      currency: data.currency,
      goalAmount: data.goal_amount,
      raisedAmount: data.raised_amount,
      updatedAt: data.updated_at,
    };
  },
);