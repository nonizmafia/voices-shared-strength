import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, ArrowUpRight, AudioLines, Check, Gift, Mail, Users, Wrench } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import journeyCover from "@/assets/patient-journey-cover.png.asset.json";
import journey1 from "@/assets/patient-journey-1.jpg.asset.json";
import journey2 from "@/assets/patient-journey-2.jpg.asset.json";
import journey3 from "@/assets/patient-journey-3.jpg.asset.json";
import journey4 from "@/assets/patient-journey-4.jpg.asset.json";
import journey5 from "@/assets/patient-journey-5.jpg.asset.json";
import journey6 from "@/assets/patient-journey-6.jpg.asset.json";
import tanjaImage from "@/assets/tanja-before-after.png.asset.json";
import logo from "@/assets/vox-care-logo-cropped.png.asset.json";
import logoDark from "@/assets/vox-care-logo-dark.png.asset.json";
import heroImage from "@/assets/vox-hero-clinical.png.asset.json";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { getCampaignTotal, type CampaignTotal } from "@/lib/campaign.functions";
import { createDonationCheckout } from "@/lib/donation.functions";
import { ShareButtons } from "@/components/share-buttons";
import { CAMPAIGN_TITLE, CAMPAIGN_DESCRIPTION, SITE_URL } from "@/lib/site";

const campaignQuery = queryOptions({
  queryKey: ["campaign-total", "vox-care"],
  queryFn: () => getCampaignTotal(),
  staleTime: 30_000,
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VOX Care | Help restore their voice" },
      {
        name: "description",
        content:
          "Support VOX Care’s non-profit research to restore natural voices after throat cancer surgery.",
      },
      { property: "og:title", content: "VOX Care | Not just a voice. Their voice, back." },
      {
        property: "og:description",
        content: "Fund voice restoration research for people who have lost their natural voice.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(campaignQuery),
  component: Index,
  errorComponent: CampaignError,
  notFoundComponent: () => <p className="p-8 text-foreground">Campaign not found.</p>,
});

const journeyImages = [journeyCover, journey1, journey2, journey3, journey4, journey5, journey6];
const amounts = [500, 1000, 5000, 25000];

function formatCampaignAmount(amount: number) {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(1)} Crore`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1)} Lakh`;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function Index() {
  const { data: campaign } = useSuspenseQuery(campaignQuery);
  const queryClient = useQueryClient();
  const galleryRef = useRef<HTMLDivElement>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | "custom">(1000);
  const [customAmount, setCustomAmount] = useState("");
  const percentage = Math.min((campaign.raisedAmount / campaign.goalAmount) * 100, 100);

  useEffect(() => {
    const channel = supabase
      .channel("vox-campaign-total")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "campaign_totals", filter: "campaign_slug=eq.vox-care" },
        (payload) => {
          const row = payload.new as {
            campaign_slug?: string;
            currency?: string;
            goal_amount?: number;
            raised_amount?: number;
            updated_at?: string;
          };
          if (
            row.campaign_slug &&
            row.currency &&
            typeof row.goal_amount === "number" &&
            typeof row.raised_amount === "number" &&
            row.updated_at
          ) {
            const updated: CampaignTotal = {
              campaignSlug: row.campaign_slug,
              currency: row.currency,
              goalAmount: row.goal_amount,
              raisedAmount: row.raised_amount,
              updatedAt: row.updated_at,
            };
            queryClient.setQueryData(campaignQuery.queryKey, updated);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const donationValue = selectedAmount === "custom" ? Number(customAmount) : selectedAmount;
  const startCheckout = useServerFn(createDonationCheckout);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const donate = async () => {
    if (!(donationValue >= 100)) {
      setPayError("The minimum donation is ₹100.");
      return;
    }
    setPaying(true);
    setPayError(null);
    try {
      const res = await startCheckout({ data: { amount: Math.round(donationValue), origin: window.location.origin } });
      if (res.ok) window.location.href = res.url;
      else setPayError(res.error);
    } catch {
      setPayError("The payment could not be started. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  const scrollGallery = (direction: number) => {
    galleryRef.current?.scrollBy({ left: direction * 330, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="#top" aria-label="VOX Care home" className="block">
            <img src={logoDark.url} alt="VOX Care" className="h-12 w-auto max-w-40 object-contain object-left sm:h-14" />
          </a>
          <div className="flex items-center gap-3 sm:gap-6">
            <a href="mailto:voxhealthcaree@gmail.com" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block">
              voxhealthcaree@gmail.com
            </a>
            <Button asChild className="h-11 rounded-none px-5 shadow-none">
              <a href="#donate">Donate now</a>
            </Button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="relative mx-auto max-w-[1440px] px-3 pt-3 sm:px-6 sm:pt-6">
          <div className="relative min-h-[calc(100svh-7rem)] overflow-hidden rounded-[4px] bg-ink sm:min-h-[760px]">
            <img src={heroImage.url} alt="A doctor examining a patient’s throat" className="absolute inset-0 h-full w-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-transparent" />
            <div className="relative z-10 flex min-h-[calc(100svh-7rem)] flex-col justify-end px-5 pb-7 pt-32 sm:min-h-[760px] sm:px-12 sm:pb-12 lg:px-16">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-cyan animate-rise">VOX Care · Non-profit voice restoration initiative</p>
              <div className="grid items-end gap-8 lg:grid-cols-[1.25fr_0.75fr]">
                <div className="max-w-4xl animate-rise [animation-delay:100ms]">
                  <h1 className="text-balance text-[2.7rem] font-extrabold leading-[1.02] text-background sm:text-7xl lg:text-[6.5rem]">
                    Not just a voice.<br />Their voice, back.
                  </h1>
                  <p className="mt-6 max-w-2xl text-base leading-7 text-background/85 sm:text-xl sm:leading-8">
                    Throat cancer surgery can take away a person&apos;s ability to speak. VOX is building a device that uses the latest technologies to restore a person&apos;s own natural voice after they lose it.
                  </p>
                </div>
                <LiveProgress campaign={campaign} percentage={percentage} />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-14 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:py-36">
          <article>
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-primary">01 — The challenge</p>
            <h2 className="max-w-xl text-4xl font-bold leading-tight sm:text-6xl">A familiar voice is part of who we are.</h2>
          </article>
          <div className="space-y-12 text-lg leading-8 text-muted-foreground">
            <div className="border-t border-border pt-6">
              <h3 className="mb-3 text-xl font-bold text-foreground">The problem</h3>
              <p>When someone loses their voice to throat cancer, they don&apos;t just lose the ability to speak — they lose the voice their family has always known. Existing solutions sound mechanical and take months to learn.</p>
            </div>
            <div className="border-t border-border pt-6">
              <h3 className="mb-3 text-xl font-bold text-foreground">The solution</h3>
              <p>VOX is a non-profit initiative developing a device that restores a person&apos;s own natural voice using the latest voice technology, so when they speak again, it sounds like them — not a machine.</p>
            </div>
          </div>
        </section>

        <section className="bg-ink py-20 text-background sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-cyan">Patient story — Tanja Clara</p>
              <h2 className="mb-8 max-w-lg text-4xl font-bold leading-tight sm:text-6xl">“I still hear my old voice in my dreams.”</h2>
              <img src={tanjaImage.url} alt="Tanja Clara during recovery and four years after her laryngectomy" className="aspect-square w-full max-w-2xl rounded-[4px] object-cover" />
            </div>
            <div className="space-y-6 text-base leading-8 text-background/78 sm:text-lg sm:leading-9 lg:pt-12">
              <p className="text-xl font-semibold text-background">Four years ago, Tanja had a total laryngectomy and bilateral neck dissection as treatment for rare, locally advanced laryngeal cancer — adenoid cystic carcinoma.</p>
              <p>The surgery removed her larynx, part of her trachea and thyroid, lymph nodes and other structures in her throat. Her natural speaking voice was gone forever, changing the way she breathes, eats, swallows and speaks.</p>
              <p>“Having my natural voice taken away from me felt like being stripped of my very identity, my personality and my confidence. Our voices are so ingrained into who we are as a person. I used to sing and I miss the loss of my singing voice hugely.”</p>
              <p>Many people who go through a laryngectomy struggle with depression and anxiety and can withdraw from society. Tanja&apos;s children are her driving force to adapt, live and thrive — to be the confident, outgoing, social mum who does not let an unusual voice hold her back.</p>
              <p>She still feels self-conscious in public. People sometimes stare or ask insensitive questions. Some days her voice does not work properly; the skin around her stoma can be sore, her valve may leak, or reflux makes speaking harder.</p>
              <p className="border-l-2 border-cyan pl-5 text-xl font-semibold text-background">“Four years on, I&apos;m still learning to love my voice. I&apos;m also just really loving living my life. Life is too short not to, and life is for living.”</p>
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link to="/stories/tanja-clara" className="text-sm font-semibold text-cyan underline-offset-4 hover:underline">Read &amp; share Tanja&apos;s story →</Link>
                <Link to="/share-your-story" className="text-sm font-semibold text-background/80 underline-offset-4 hover:underline">Are you a patient? Share your story →</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mb-10 flex items-end justify-between gap-6">
              <div>
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-primary">A patient journey</p>
                <h2 className="max-w-2xl text-4xl font-bold leading-tight sm:text-6xl">The surprising truth about cancer.</h2>
                <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">One person’s story, shared as a seven-part journey from diagnosis through recovery.</p>
              </div>
              <div className="hidden gap-2 sm:flex">
                <Button variant="outline" size="icon" aria-label="Previous story slide" onClick={() => scrollGallery(-1)}><ArrowLeft /></Button>
                <Button variant="outline" size="icon" aria-label="Next story slide" onClick={() => scrollGallery(1)}><ArrowRight /></Button>
              </div>
            </div>
          </div>
          <div ref={galleryRef} className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-[max(1.25rem,calc((100vw-80rem)/2))] pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {journeyImages.map((image, index) => (
              <figure key={image.url} className="w-[82vw] max-w-[380px] shrink-0 snap-center sm:w-[360px]">
                <img src={image.url} alt={`Cancer journey story slide ${index + 1} of 7`} className="aspect-[4/5] w-full rounded-[4px] object-cover shadow-float" loading={index > 1 ? "lazy" : "eager"} />
                <figcaption className="mt-3 flex justify-between text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <span>Patient journey</span><span>{String(index + 1).padStart(2, "0")} / 07</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-panel py-24 sm:py-32">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.65fr_1.35fr] lg:items-center">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-primary">Patient perspective</p>
              <h2 className="text-4xl font-bold leading-tight sm:text-6xl">Hear their story.</h2>
              <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">Tanja shares what life is really like after losing her voice. Listen closely — the robotic sound you hear in the video is the voice today&apos;s devices give people. That mechanical voice is exactly the problem VOX exists to solve.</p>
            </div>
            <div className="overflow-hidden rounded-[4px] bg-ink shadow-float">
              <iframe className="aspect-video w-full" src="https://www.youtube-nocookie.com/embed/OGynMqAUHiY" title="Patient story about life after cancer" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
            </div>
          </div>
        </section>

        <section id="donate" className="scroll-mt-20 bg-primary py-24 text-primary-foreground sm:py-32">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground/70">Fund the next voice</p>
              <h2 className="max-w-lg text-5xl font-bold leading-[1.03] sm:text-7xl">Choose an amount.</h2>
              <p className="mt-6 max-w-md text-lg leading-8 text-primary-foreground/80">Every donation goes directly toward R&amp;D and testing.</p>
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {amounts.map((amount) => (
                  <Button key={amount} type="button" variant={selectedAmount === amount ? "secondary" : "outline"} className="h-16 rounded-none border-primary-foreground/35 bg-transparent text-base text-primary-foreground shadow-none hover:bg-primary-foreground hover:text-primary" onClick={() => setSelectedAmount(amount)}>
                    {selectedAmount === amount && <Check />}₹{amount.toLocaleString("en-IN")}
                  </Button>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <label className="relative block">
                  <span className="sr-only">Custom donation amount</span>
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg text-primary-foreground/65">₹</span>
                  <input type="number" min="1" inputMode="numeric" placeholder="Custom amount" value={customAmount} onFocus={() => setSelectedAmount("custom")} onChange={(event) => { setSelectedAmount("custom"); setCustomAmount(event.target.value); }} className="h-16 w-full rounded-none border border-primary-foreground/35 bg-transparent pl-10 pr-5 text-base text-primary-foreground outline-none placeholder:text-primary-foreground/60 focus:border-primary-foreground" />
                </label>
                <Button type="button" variant="secondary" className="h-16 rounded-none px-8 text-base" disabled={paying || (selectedAmount === "custom" && donationValue <= 0)} onClick={donate}>
                  {paying ? "Opening secure checkout…" : <>Donate now <ArrowUpRight /></>}
                </Button>
              </div>
              {payError && <p role="alert" className="text-sm font-semibold text-primary-foreground">{payError}</p>}
              <p className="flex items-center gap-2 text-sm text-primary-foreground/75"><Gift className="size-4" /> Donations above ₹5,000 are eligible for a gift.</p>
              <div className="border-t border-primary-foreground/20 pt-5 [&_a]:border-primary-foreground/40 [&_a]:text-primary-foreground [&_button]:border-primary-foreground/40 [&_button]:text-primary-foreground [&_svg]:text-primary-foreground">
                <p className="mb-3 text-sm text-primary-foreground/75">Can&apos;t give today? Sharing helps just as much.</p>
                <ShareButtons url={SITE_URL} title={CAMPAIGN_TITLE} text={CAMPAIGN_DESCRIPTION} />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
          <div className="mb-12 max-w-2xl">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-primary">Transparent by design</p>
            <h2 className="text-4xl font-bold leading-tight sm:text-6xl">Where your donation goes.</h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">Three concrete stages take the VOX device from the workbench to the people who need it.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { icon: Wrench, title: "Prototype engineering", text: "Designing and building the core VOX hardware — the device that will carry a person's own voice." },
              { icon: AudioLines, title: "Voice technology development & testing", text: "Refining the voice technology until it sounds naturally like the person speaking — never like a machine." },
              { icon: Users, title: "Patient testing", text: "Placing the device in real patients' hands and improving it with their honest feedback." },
            ].map((stage, index) => (
              <div key={stage.title} className="group relative overflow-hidden border border-border bg-background p-8 transition-shadow duration-300 hover:shadow-float">
                <span className="pointer-events-none absolute right-5 top-4 text-6xl font-extrabold text-muted/40 transition-colors duration-300 group-hover:text-primary/20">0{index + 1}</span>
                <div className="mb-8 flex size-12 items-center justify-center bg-primary text-primary-foreground">
                  <stage.icon className="size-6" />
                </div>
                <h3 className="mb-3 pr-10 text-xl font-bold leading-snug">{stage.title}</h3>
                <p className="text-base leading-7 text-muted-foreground">{stage.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 flex items-center gap-2 text-sm font-medium text-muted-foreground"><span className="size-2 bg-cyan" /> 100% of every donation funds these three stages — nothing else.</p>
        </section>

        <section className="border-t border-border bg-panel py-24 sm:py-32">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-2">
            <h2 className="text-4xl font-bold sm:text-6xl">Questions,<br />answered.</h2>
              <Accordion type="single" collapsible className="border-t border-border">
                <AccordionItem value="use"><AccordionTrigger className="py-6 text-left text-base hover:no-underline">What will my donation be used for?</AccordionTrigger><AccordionContent className="pb-6 text-base leading-7 text-muted-foreground">Entirely for R&amp;D and testing of the VOX device — no other use.</AccordionContent></AccordionItem>
                <AccordionItem value="gift"><AccordionTrigger className="py-6 text-left text-base hover:no-underline">Do I get anything for donating?</AccordionTrigger><AccordionContent className="pb-6 text-base leading-7 text-muted-foreground">Donations above ₹5,000 are eligible for a gift.</AccordionContent></AccordionItem>
                <AccordionItem value="how"><AccordionTrigger className="py-6 text-left text-base hover:no-underline">How do I actually donate?</AccordionTrigger><AccordionContent className="pb-6 text-base leading-7 text-muted-foreground">Choose an amount in the donation section above. Our team will then reach out to you with the next steps.</AccordionContent></AccordionItem>
                <AccordionItem value="updates"><AccordionTrigger className="py-6 text-left text-base hover:no-underline">Will I know how my donation is used?</AccordionTrigger><AccordionContent className="pb-6 text-base leading-7 text-muted-foreground">Yes. Every supporter receives progress updates as the VOX device moves from prototype to patient testing.</AccordionContent></AccordionItem>
                <AccordionItem value="corporate"><AccordionTrigger className="py-6 text-left text-base hover:no-underline">Can my company or organisation support VOX?</AccordionTrigger><AccordionContent className="pb-6 text-base leading-7 text-muted-foreground">Absolutely. Write to voxhealthcaree@gmail.com and we&apos;ll set up a partnership that fits your organisation.</AccordionContent></AccordionItem>
                <AccordionItem value="timeline"><AccordionTrigger className="py-6 text-left text-base hover:no-underline">When will the VOX device reach patients?</AccordionTrigger><AccordionContent className="pb-6 text-base leading-7 text-muted-foreground">The device is in active R&amp;D and testing. Your donation directly accelerates the path to the first patients.</AccordionContent></AccordionItem>
              </Accordion>
          </div>
        </section>
      </main>

      <footer className="bg-ink py-14 text-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <img src={logo.url} alt="VOX Care" className="h-12 w-auto max-w-48 object-contain object-left" />
            <p className="mt-5 max-w-sm text-sm leading-6 text-background/60">Building technology that helps people sound like themselves again.</p>
          </div>
          <div className="space-y-3 text-sm">
            <a href="mailto:voxhealthcaree@gmail.com" className="flex items-center gap-2 text-background/80 transition-colors hover:text-cyan"><Mail className="size-4" /> voxhealthcaree@gmail.com</a>
            <a href="https://linkedin.com/in/yash-kesharwani-506340316" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-background/80 transition-colors hover:text-cyan">LinkedIn <ArrowUpRight className="size-4" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function LiveProgress({ campaign, percentage }: { campaign: CampaignTotal; percentage: number }) {
  return (
    <div className="border border-background/25 bg-ink/70 p-5 text-background backdrop-blur-md animate-rise [animation-delay:200ms] sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-cyan"><span className="size-2 rounded-full bg-cyan animate-pulse" />Live campaign</span>
        <span className="text-sm font-bold">{percentage.toFixed(1)}%</span>
      </div>
      <div className="mb-4 h-2 overflow-hidden bg-background/20">
        <div className="h-full bg-cyan animate-progress" style={{ width: `${percentage}%` }} />
      </div>
      <div className="flex items-end justify-between gap-4">
        <div><p className="text-2xl font-bold sm:text-3xl">{formatCampaignAmount(campaign.raisedAmount)}</p><p className="mt-1 text-xs text-background/60">raised so far</p></div>
        <div className="text-right"><p className="font-semibold">{formatCampaignAmount(campaign.goalAmount)}</p><p className="mt-1 text-xs text-background/60">campaign goal</p></div>
      </div>
      <Button asChild className="mt-6 h-12 w-full rounded-none bg-background text-foreground shadow-none hover:bg-cyan">
        <a href="#donate">Donate now <ArrowRight /></a>
      </Button>
    </div>
  );
}

function CampaignError() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="max-w-md text-center"><h1 className="text-3xl font-bold">VOX Care</h1><p className="mt-4 text-muted-foreground">The campaign page could not load. Please refresh and try again.</p></div>
    </div>
  );
}