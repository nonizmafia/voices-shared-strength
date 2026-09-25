import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Copy, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

import { ShareButtons } from "@/components/share-buttons";
import { Button } from "@/components/ui/button";
import { generateStory, type GeneratedStory } from "@/lib/story.functions";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/share-your-story")({
  head: () => ({
    meta: [
      { title: "Share your story | VOX Care" },
      { name: "description", content: "Patients: write a rough draft of your journey and VOX Care will help shape it into a story worth sharing." },
      { property: "og:title", content: "Share your voice journey with VOX Care" },
      { property: "og:description", content: "Turn your rough draft into an empathetic, campaign-ready story." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ShareYourStory,
});

function ShareYourStory() {
  const run = useServerFn(generateStory);
  const [name, setName] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedStory | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await run({ data: { name: name || undefined, draft } });
      if (res.ok) setResult({ title: res.title, story: res.story, quote: res.quote });
      else setError(res.error);
    } catch {
      setError("Something went wrong. Please check your draft and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-20">
        <Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to campaign
        </Link>
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-primary">For patients</p>
        <h1 className="text-4xl font-bold leading-tight sm:text-6xl">Share your story.</h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
          Write freely — as rough as you like. We&apos;ll help shape it into a warm, honest story, keeping every detail true to you. The VOX team reviews every story before anything is shared.
        </p>

        <form onSubmit={submit} className="mt-10 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Your name (optional)</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className="h-12 w-full rounded-[4px] border border-input bg-background px-4 outline-none focus:border-primary" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Your draft</span>
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} minLength={50} maxLength={8000} required rows={10} placeholder="What happened, how losing your voice changed daily life, who kept you going, what you hope for…" className="w-full rounded-[4px] border border-input bg-background p-4 leading-7 outline-none focus:border-primary" />
            <span className="mt-1 block text-xs text-muted-foreground">{draft.length} / 8000 · at least 50 characters</span>
          </label>
          <Button type="submit" size="lg" disabled={loading || draft.trim().length < 50} className="h-14 rounded-none px-8">
            {loading ? <><Loader2 className="animate-spin" /> Writing your story…</> : <><Sparkles /> Create my story</>}
          </Button>
          {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
        </form>

        {result && (
          <article className="mt-14 border-t border-border pt-10">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">Your story</p>
            <h2 className="text-3xl font-bold leading-tight sm:text-4xl">{result.title}</h2>
            {result.quote && <blockquote className="my-6 border-l-2 border-cyan pl-5 text-xl font-semibold">“{result.quote}”</blockquote>}
            <div className="space-y-4 whitespace-pre-line text-base leading-8 text-muted-foreground">{result.story}</div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(`${result.title}\n\n${result.story}`)}>
                <Copy /> Copy story
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">Saved for the VOX team to review. Want others to support the cause?</p>
            <ShareButtons className="mt-3" url={SITE_URL} title="Help restore natural voices with VOX Care" text="I shared my story with VOX Care. Help restore natural voices:" />
          </article>
        )}
      </div>
    </div>
  );
}
