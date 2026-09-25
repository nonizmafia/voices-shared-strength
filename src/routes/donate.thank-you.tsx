import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2 } from "lucide-react";
import { z } from "zod";

import { ShareButtons } from "@/components/share-buttons";
import { Button } from "@/components/ui/button";
import { verifyDonation } from "@/lib/donation.functions";
import { CAMPAIGN_DESCRIPTION, CAMPAIGN_TITLE, SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/donate/thank-you")({
  validateSearch: z.object({ session_id: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Thank you for your donation | VOX Care" },
      { name: "description", content: "Your donation to VOX Care helps restore natural voices." },
      { property: "og:title", content: "Thank you for supporting VOX Care" },
      { property: "og:description", content: CAMPAIGN_DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ThankYou,
});

function ThankYou() {
  const { session_id } = Route.useSearch();
  const verify = useServerFn(verifyDonation);
  const { data, isLoading } = useQuery({
    queryKey: ["donation", session_id],
    queryFn: () => verify({ data: { sessionId: session_id! } }),
    enabled: !!session_id,
  });

  return (
    <div className="flex min-h-screen items-center bg-primary text-primary-foreground">
      <div className="mx-auto max-w-2xl px-5 py-16 text-center sm:px-8">
        {isLoading ? (
          <Loader2 className="mx-auto size-10 animate-spin" />
        ) : data?.ok ? (
          <>
            <CheckCircle2 className="mx-auto mb-6 size-14" />
            <h1 className="text-4xl font-bold sm:text-6xl">Thank you.</h1>
            <p className="mt-5 text-lg leading-8 text-primary-foreground/85">
              {data.amount ? `Your donation of ₹${(data.amount / 100).toLocaleString("en-IN")} ` : "Your donation "}
              was received. You&apos;re helping someone speak with their own voice again. A receipt has been sent to your email.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-bold sm:text-5xl">We couldn&apos;t confirm this donation.</h1>
            <p className="mt-5 text-lg text-primary-foreground/85">{data && !data.ok ? data.error : "No donation was found."} If you were charged, email voxhealthcaree@gmail.com.</p>
          </>
        )}
        <div className="mt-10 flex flex-col items-center gap-6">
          <ShareButtons url={SITE_URL} title={CAMPAIGN_TITLE} text="I just supported VOX Care — help restore natural voices:" />
          <Button asChild variant="secondary" className="rounded-none"><Link to="/">Back to campaign</Link></Button>
        </div>
      </div>
    </div>
  );
}
