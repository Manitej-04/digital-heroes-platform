import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    // Check admin role
    const { data: adminProfile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    if (adminProfile?.role !== "admin") {
      return NextResponse.json(
        { error: "Administrator access required." },
        { status: 403 }
      );
    }

    // Get profiles
    const { data: profiles, error: usersError } =
      await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

    if (usersError) {
      return NextResponse.json(
        { error: usersError.message },
        { status: 500 }
      );
    }

    // Get subscriptions
    const { data: subscriptions, error: subscriptionsError } =
      await supabase
        .from("subscriptions")
        .select(
          `
            id,
            user_id,
            plan,
            status,
            amount_paise,
            charity_percent,
            started_at,
            current_period_start,
            current_period_end,
            cancelled_at,
            provider,
            created_at
          `
        )
        .order("created_at", { ascending: false });

    if (subscriptionsError) {
      return NextResponse.json(
        { error: subscriptionsError.message },
        { status: 500 }
      );
    }

    // Get auth emails through the admin-safe server auth API
    const usersWithSubscriptions = (profiles ?? []).map(
      (profile) => {
        const subscription =
          (subscriptions ?? []).find(
            (item) => item.user_id === profile.id
          ) ?? null;

        return {
          id: profile.id,
          name:
            profile.full_name ??
            profile.name ??
            "Unnamed user",
          role: profile.role ?? "user",
          charity_percent:
            profile.charity_percent ?? 10,
          created_at: profile.created_at,
          subscription,
        };
      }
    );

    // Statistics
    const totalUsers = usersWithSubscriptions.length;

    const activeSubscribers = usersWithSubscriptions.filter(
      (item) =>
        item.subscription?.status === "active" &&
        item.subscription?.current_period_end &&
        new Date(item.subscription.current_period_end) >
          new Date()
    ).length;

    const monthlySubscribers = usersWithSubscriptions.filter(
      (item) =>
        item.subscription?.status === "active" &&
        item.subscription?.plan === "monthly"
    ).length;

    const yearlySubscribers = usersWithSubscriptions.filter(
      (item) =>
        item.subscription?.status === "active" &&
        item.subscription?.plan === "yearly"
    ).length;

    return NextResponse.json({
      users: usersWithSubscriptions,
      stats: {
        totalUsers,
        activeSubscribers,
        monthlySubscribers,
        yearlySubscribers,
      },
    });
  } catch (error) {
    console.error("Admin users API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load users.",
      },
      { status: 500 }
    );
  }
}