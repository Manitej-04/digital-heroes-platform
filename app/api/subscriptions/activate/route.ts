import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const activateSchema = z.object({
  plan: z.enum(["monthly", "yearly"]),
  charityPercent: z.number().int().min(10).max(100),
});

const PLAN_PRICES: Record<"monthly" | "yearly", number> = {
  monthly: 49900,
  yearly: 499900,
};

const PLAN_DAYS: Record<"monthly" | "yearly", number> = {
  monthly: 30,
  yearly: 365,
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = activateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid subscription details.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { plan, charityPercent } = parsed.data;

    // Prevent duplicate active subscriptions.
    const { data: existingSubscription, error: existingError } =
      await supabase
        .from("subscriptions")
        .select("id, status, current_period_end")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (existingError) {
      console.error("Subscription lookup error:", existingError);

      return NextResponse.json(
        { error: "Unable to check your current subscription." },
        { status: 500 }
      );
    }

    if (existingSubscription) {
      return NextResponse.json(
        {
          error: "You already have an active subscription.",
          subscriptionId: existingSubscription.id,
        },
        { status: 409 }
      );
    }

    const now = new Date();
    const periodEnd = new Date(now);

    periodEnd.setDate(periodEnd.getDate() + PLAN_DAYS[plan]);

    // Demo/test provider.
    // This can later be replaced with Stripe Checkout/webhooks.
    const providerSubscriptionId = `demo_${plan}_${user.id}_${Date.now()}`;

    const { data: subscription, error: subscriptionError } =
      await supabase
        .from("subscriptions")
        .insert({
          user_id: user.id,
          plan,
          status: "active",
          amount_paise: PLAN_PRICES[plan],
          charity_percent: charityPercent,
          started_at: now.toISOString(),
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          provider: "demo",
          provider_subscription_id: providerSubscriptionId,
        })
        .select()
        .single();

    if (subscriptionError) {
      console.error("Subscription creation error:", subscriptionError);

      return NextResponse.json(
        { error: "Unable to activate your subscription." },
        { status: 500 }
      );
    }

    // Keep the user's profile charity preference in sync.
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        charity_percent: charityPercent,
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    return NextResponse.json({
      success: true,
      subscription,
      message: "Subscription activated successfully.",
    });
  } catch (error) {
    console.error("Activate subscription error:", error);

    return NextResponse.json(
      { error: "Something went wrong while activating your subscription." },
      { status: 500 }
    );
  }
}