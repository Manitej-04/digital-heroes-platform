import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // 1. Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Get the user's latest subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select(
      `
        id,
        plan,
        status,
        amount_paise,
        charity_percent,
        current_period_start,
        current_period_end,
        cancelled_at
      `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 3. No subscription → subscribe
  if (!subscription) {
    redirect("/subscribe");
  }

  // 4. Check whether the subscription is currently active
  const now = new Date();
  const periodEnd = new Date(subscription.current_period_end);

  const isPeriodActive = periodEnd > now;
  const isSubscriptionActive =
    subscription.status === "active" && isPeriodActive;

  // 5. Expired/lapsed/cancelled subscriptions cannot access dashboard
  if (!isSubscriptionActive) {
    redirect("/subscribe");
  }

  // 6. Subscriber is allowed into the dashboard
  return <>{children}</>;
}