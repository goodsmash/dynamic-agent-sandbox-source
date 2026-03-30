/**
 * Stripe Billing Integration
 *
 * Handles:
 *  - Checkout session creation (free → pro upgrades)
 *  - Webhook processing (payment confirmation → D1 plan update)
 *
 * Setup:
 *  1. wrangler secret put STRIPE_SECRET
 *  2. wrangler secret put STRIPE_WEBHOOK_SECRET
 *  3. Set the webhook URL in Stripe Dashboard:
 *     https://your-worker.workers.dev/api/billing/webhook
 *     Events: checkout.session.completed, customer.subscription.deleted
 */

import Stripe from "stripe";
import type { Env } from "./types/index";

function getStripe(env: Env): Stripe {
  return new Stripe(env.STRIPE_SECRET, {
    apiVersion: "2025-01-27.acacia",
    // Stripe requires fetch() — Cloudflare Workers provide this natively
    httpClient: Stripe.createFetchHttpClient(),
  });
}

/**
 * Create a Stripe Checkout Session for a Pro plan upgrade.
 * The price ID comes from your Stripe Dashboard.
 */
export async function createCheckoutSession(userId: string, env: Env): Promise<string> {
  const stripe = getStripe(env);

  // Get or create Stripe customer for this user
  const user = await env.DB.prepare(
    "SELECT email, stripe_customer_id FROM users WHERE id = ?"
  ).bind(userId).first<{ email: string; stripe_customer_id: string | null }>();

  let customerId = user?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user?.email || `${userId}@openclaw.dev`,
      metadata: { userId },
    });
    customerId = customer.id;

    await env.DB.prepare(
      "UPDATE users SET stripe_customer_id = ? WHERE id = ?"
    ).bind(customerId, userId).run();
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        // Replace with your actual Stripe Price ID
        // Create it in Stripe Dashboard → Products → Add Product
        price: "price_YOUR_PRO_PLAN_PRICE_ID",
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${getBaseUrl(env)}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getBaseUrl(env)}/billing/cancel`,
    metadata: { userId },
  });

  return session.url!;
}

/**
 * Process Stripe webhooks. Must be called with the raw request body
 * (not parsed JSON) for signature verification.
 */
export async function handleStripeWebhook(request: Request, env: Env): Promise<Response> {
  const stripe = getStripe(env);

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    // Verify the webhook came from Stripe — prevents spoofing
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  // Idempotency check — Stripe retries failed webhooks
  const existing = await env.DB.prepare(
    "SELECT stripe_event_id FROM billing_events WHERE stripe_event_id = ?"
  ).bind(event.id).first();

  if (existing) {
    return new Response("Already processed", { status: 200 });
  }

  // Process the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string;

      // Look up user by Stripe customer ID
      const user = await env.DB.prepare(
        "SELECT id FROM users WHERE stripe_customer_id = ?"
      ).bind(customerId).first<{ id: string }>();

      if (user) {
        // Upgrade to Pro — unlimited agents
        await env.DB.prepare(
          "UPDATE users SET plan = 'pro', max_agents = 9999, updated_at = datetime('now') WHERE id = ?"
        ).bind(user.id).run();

        console.log(`User ${user.id} upgraded to Pro`);
      }
      break;
    }

    case "customer.subscription.deleted": {
      // Downgrade back to free when subscription cancels
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const user = await env.DB.prepare(
        "SELECT id FROM users WHERE stripe_customer_id = ?"
      ).bind(customerId).first<{ id: string }>();

      if (user) {
        await env.DB.prepare(
          "UPDATE users SET plan = 'free', max_agents = 1, updated_at = datetime('now') WHERE id = ?"
        ).bind(user.id).run();

        // Terminate extra sessions beyond the free limit
        await env.DB.prepare(`
          UPDATE agent_sessions SET status = 'terminated'
          WHERE user_id = ?
          AND status = 'active'
          AND id NOT IN (
            SELECT id FROM agent_sessions
            WHERE user_id = ? AND status = 'active'
            ORDER BY created_at DESC LIMIT 1
          )
        `).bind(user.id, user.id).run();

        console.log(`User ${user.id} downgraded to Free`);
      }
      break;
    }
  }

  // Record event as processed
  await env.DB.prepare(
    "INSERT INTO billing_events (stripe_event_id, event_type) VALUES (?, ?)"
  ).bind(event.id, event.type).run();

  return new Response("OK", { status: 200 });
}

function getBaseUrl(env: Env): string {
  return env.ENVIRONMENT === "production"
    ? "https://your-app.workers.dev"
    : "http://localhost:8787";
}
