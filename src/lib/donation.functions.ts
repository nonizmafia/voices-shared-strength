import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CheckoutInput = z.object({
  amount: z.number().int().min(100).max(10_000_000),
  origin: z.string().url(),
});

const VerifyInput = z.object({
  sessionId: z.string().trim().min(10).max(200),
});

/**
 * Creates a Stripe Checkout session for a one-time donation (INR).
 * Uses Stripe's REST API directly with the project's own Stripe secret key.
 */
export const createDonationCheckout = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CheckoutInput.parse(input))
  .handler(async ({ data }) => {
    const secretKey = process.env["STRIPE_SECRET_KEY"];
    if (!secretKey) {
      return {
        ok: false as const,
        error:
          "Online payments are not set up for this campaign yet. Please reach us at voxhealthcaree@gmail.com to donate.",
      };
    }

    const body = new URLSearchParams({
      mode: "payment",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "inr",
      "line_items[0][price_data][unit_amount]": String(data.amount * 100),
      "line_items[0][price_data][product_data][name]": "Donation to VOX Care",
      "line_items[0][price_data][product_data][description]":
        "Supporting voice restoration research so people can speak with their own voice again.",
      success_url: `${data.origin}/donate/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${data.origin}/`,
      "metadata[campaign]": "vox-care",
    });

    try {
      const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
      const json = (await res.json()) as { url?: string; error?: { message?: string } };
      if (!res.ok || !json.url) {
        console.error("[donation] stripe error:", json.error?.message ?? res.status);
        return { ok: false as const, error: "The payment could not be started. Please try again in a moment." };
      }
      return { ok: true as const, url: json.url };
    } catch (err) {
      console.error("[donation] network error:", err);
      return { ok: false as const, error: "The payment could not be started. Please check your connection and try again." };
    }
  });

/** Confirms a completed Checkout session so the thank-you page can show the real amount. */
export const verifyDonation = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => VerifyInput.parse(input))
  .handler(async ({ data }) => {
    const secretKey = process.env["STRIPE_SECRET_KEY"];
    if (!secretKey) return { ok: false as const, error: "Payments are not configured." };

    try {
      const res = await fetch(
        `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(data.sessionId)}`,
        { headers: { Authorization: `Bearer ${secretKey}` } },
      );
      const json = (await res.json()) as {
        payment_status?: string;
        amount_total?: number;
        error?: { message?: string };
      };
      if (!res.ok) return { ok: false as const, error: "This donation could not be verified." };
      if (json.payment_status !== "paid") return { ok: false as const, error: "This donation is not completed yet." };
      return { ok: true as const, amount: json.amount_total ?? null };
    } catch {
      return { ok: false as const, error: "This donation could not be verified." };
    }
  });
