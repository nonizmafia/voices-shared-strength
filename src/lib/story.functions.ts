import { createOpenAI } from "@ai-sdk/openai";
import { createServerFn } from "@tanstack/react-start";
import { NoObjectGeneratedError, Output, streamText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayRunIdFetch } from "./ai-gateway.server";

const StoryInput = z.object({
  name: z.string().trim().max(80).optional(),
  draft: z.string().trim().min(50).max(8000),
});

const StoryOutput = z.object({
  title: z.string(),
  story: z.string(),
  quote: z.string(),
});

export type GeneratedStory = z.infer<typeof StoryOutput>;

const SYSTEM_PROMPT = `You are the story editor for VOX Care, a non-profit voice restoration initiative that is developing a device to give people who lost their natural voice (for example after total laryngectomy surgery for throat cancer) their own natural-sounding voice back.

A patient has submitted a raw draft about their journey. Turn it into an empathetic, campaign-ready, first-person story of roughly 350-500 words that VOX Care may share with donors and supporters.

Rules:
- Warm, dignified, hopeful tone. Never pity the person; honour their resilience.
- Preserve every real fact, name and detail from the draft. Never invent events, medical details or statistics.
- Do not exaggerate or dramatise; write plainly and truthfully.
- Do not make medical claims about VOX Care's technology beyond what the draft supports.
- Gently connect to the mission of restoring natural voices where it fits naturally, without pressure or sales language.
- Also return one short, powerful pull-quote (max 25 words) lifted from or faithful to the draft.
- If the draft is too short or generic, work only with what is given and keep the story humble and general.
- Write in the language the draft was written in (English unless the draft is otherwise).`;

export const generateStory = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => StoryInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return { ok: false as const, error: "The story tool is not available right now. Please try again later." };
    }

    const runIdFetch = createLovableAiGatewayRunIdFetch();
    const lovable = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey, // satisfies the SDK; the gateway authenticates on the Lovable-API-Key header
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runIdFetch.fetch,
    });

    const prompt = [
      `Patient's draft:`,
      `"""${data.draft}"""`,
      ``,
      `Patient's name: ${data.name?.trim() || "not provided"}`,
      ``,
      `Turn this draft into the campaign-ready story, pull-quote and title as instructed.`,
    ].join("\n");

    let output: GeneratedStory;
    try {
      const result = streamText({
        model: lovable.responses("openai/gpt-6-astra"),
        system: SYSTEM_PROMPT,
        prompt,
        output: Output.object({ schema: StoryOutput }),
        providerOptions: {
          openai: {
            forceReasoning: true,
            reasoningEffort: "low",
            reasoningSummary: "auto",
            store: false,
            include: ["reasoning.encrypted_content"],
          },
        },
      });
      output = await result.output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        const fallback = (error.text ?? "").trim();
        if (!fallback) {
          return { ok: false as const, error: "The story could not be generated this time. Please try again." };
        }
        output = { title: "A voice worth hearing", story: fallback, quote: "" };
      } else {
        return { ok: false as const, error: "The story could not be generated this time. Please try again." };
      }
    }

    if (!output.story?.trim()) {
      return { ok: false as const, error: "The story came back empty. Please try again." };
    }

    // Persist the submission privately (service-role write; patients can review before publishing).
    let savedId: string | null = null;
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: inserted, error: dbError } = await supabaseAdmin
        .from("patient_stories")
        .insert({
          patient_name: data.name?.trim() || null,
          draft: data.draft,
          title: output.title,
          story: output.story,
          quote: output.quote || null,
          status: "submitted",
        })
        .select("id")
        .single();
      if (dbError) console.error("[story] insert failed:", dbError.message);
      else savedId = inserted?.id ?? null;
    } catch (dbErr) {
      console.error("[story] db unavailable:", dbErr);
    }

    return {
      ok: true as const,
      id: savedId,
      title: output.title,
      story: output.story,
      quote: output.quote,
    };
  });
