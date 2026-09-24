import { Check, Facebook, Link2, Linkedin, Mail, MessageCircle, Share2, Twitter } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ShareButtonsProps {
  url: string;
  title: string;
  text?: string;
  className?: string;
}

export function ShareButtons({ url, title, text, className }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const message = encodeURIComponent(text ? `${text}\n${url}` : `${title}\n${url}`);

  const targets = [
    {
      label: "Share on WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${message}`,
    },
    {
      label: "Share on X",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
    },
    {
      label: "Share on Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    },
    {
      label: "Share on LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    },
    {
      label: "Share by email",
      icon: Mail,
      href: `mailto:?subject=${t}&body=${message}`,
    },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — still show feedback via select-free fallback.
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`} aria-label="Share options">
      <Share2 className="size-4 text-muted-foreground" aria-hidden />
      {targets.map(({ label, icon: Icon, href }) => (
        <Button
          key={label}
          asChild
          variant="outline"
          size="icon"
          className="size-10 rounded-full border-border bg-transparent hover:bg-primary hover:text-primary-foreground hover:border-primary"
        >
          <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
            <Icon className="size-4" />
          </a>
        </Button>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={copyLink}
        className="h-10 rounded-full border-border bg-transparent hover:bg-primary hover:text-primary-foreground hover:border-primary"
        aria-label="Copy link"
      >
        {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
        <span className="text-sm font-medium">{copied ? "Copied" : "Copy link"}</span>
      </Button>
    </div>
  );
}
