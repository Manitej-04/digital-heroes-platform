import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          authenticated: false,
          active: false,
          status: "unauthenticated",
        },
        { status: 401 }
      );
    }

    const { data: subscription, error: subscriptionError } =
      await supabase
        .from("subscriptions")
        .select(
          `
            id,
            plan,
            status,
            amount_paise,
            charity_percent,
            started_at,
            current_period_start,
            current_period_end,
            cancelled_at,
            provider
          `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (subscriptionError) {
      console.error(
        "Subscription status lookup error:",
        subscriptionError
      );

      return NextResponse.json(
        {
          error: "Unable to retrieve subscription status.",
        },
        { status: 500 }
      );
    }

    if (!subscription) {
      return NextResponse.json({
        authenticated: true,
        active: false,
        status: "none",
        subscription: null,
      });
    }

    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end);

    const periodExpired = periodEnd <= now;

    let effectiveStatus = subscription.status;

    // An active subscription whose billing period has ended
    // is treated as lapsed.
    if (subscription.status === "active" && periodExpired) {
      effectiveStatus = "lapsed";

      // Keep the database state synchronized.
      await supabase
        .from("subscriptions")
        .update({
          status: "lapsed",
          updated_at: now.toISOString(),
        })
        .eq("id", subscription.id);
    }

    const active =
      effectiveStatus === "active" && !periodExpired;

    return NextResponse.json({
      authenticated: true,
      active,
      status: effectiveStatus,
      subscription: {
        ...subscription,
        status: effectiveStatus,
      },
    });
  } catch (error) {
    console.error("Subscription status error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while checking subscription status.",
      },
      { status: 500 }
    );
  }
}