import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";

import tanjaImage from "@/assets/tanja-before-after.png.asset.json";
import { ShareButtons } from "@/components/share-buttons";
import { Button } from "@/components/ui/button";
import { SITE_URL } from "@/lib/site";

const url = `${SITE_URL}/stories/tanja-clara`;
const image = `${SITE_URL}${tanjaImage.url}`;
const title = "Tanja Clara: “I still hear my old voice in my dreams.”";
const description = "Four years after losing her voice to throat cancer, Tanja shares life, motherhood and learning to love a new voice. Support VOX Care.";

export const Route = createFileRoute("/stories/tanja-clara")({
  head: () => ({
    meta: [
      { title: "Tanja Clara’s story | VOX Care" },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: image },
    ],
  }),
  component: TanjaStory,
});

function TanjaStory() {
  return (
    <div className="min-h-screen bg-ink text-background">
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-20">
        <Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-background/70 hover:text-cyan">
          <ArrowLeft className="size-4" /> Back to campaign
        </Link>
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-cyan">Patient story</p>
        <h1 className="text-4xl font-bold leading-tight sm:text-6xl">“I still hear my old voice in my dreams.”</h1>
        <img src={tanjaImage.url} alt="Tanja Clara during recovery and four years after her laryngectomy" className="my-10 aspect-square w-full rounded-[4px] object-cover" />
        <div className="space-y-6 text-lg leading-9 text-background/80">
          <p className="text-xl font-semibold text-background">Four years ago, Tanja had a total laryngectomy and bilateral neck dissection as treatment for adenoid cystic carcinoma.</p>
          <p>Her natural speaking voice was gone forever, changing the way she breathes, eats, swallows and speaks.</p>
          <p>“Having my natural voice taken away from me felt like being stripped of my very identity, my personality and my confidence. I used to sing and I miss my singing voice hugely.”</p>
          <p>Her children are her driving force — to be the confident, social mum who doesn&apos;t let an unusual voice hold her back. She still feels self-conscious in public, and some days her voice simply doesn&apos;t work.</p>
          <p className="border-l-2 border-cyan pl-5 text-xl font-semibold text-background">“Four years on, I&apos;m also just really loving living my life. Life is for living.”</p>
        </div>
        <div className="mt-12 space-y-6 border-t border-background/15 pt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-background/60">Share Tanja&apos;s story</p>
          <ShareButtons url={url} title={title} text={description} />
          <Button asChild variant="secondary" size="lg" className="rounded-none">
            <Link to="/" hash="donate">Help restore voices <ArrowRight /></Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
