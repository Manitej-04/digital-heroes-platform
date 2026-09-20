import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  simulateDraw,
  type DrawMode,
} from "@/lib/draw-engine";

export async function POST(request: Request) {
  try {
    // ==========================================================
    // 1. Create Supabase client
    // ==========================================================

    const supabase = await createClient();

    // ==========================================================
    // 2. Check authentication
    // ==========================================================

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized. Please log in.",
        },
        { status: 401 }
      );
    }

    // ==========================================================
    // 3. Check admin role
    // ==========================================================

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profileError) {
      console.error(
        "Profile lookup error:",
        profileError
      );

      return NextResponse.json(
        {
          error: profileError.message,
        },
        { status: 500 }
      );
    }

    if (profile?.role !== "admin") {
      return NextResponse.json(
        {
          error: "Admin access required.",
        },
        { status: 403 }
      );
    }

    // ==========================================================
    // 4. Read draw mode
    // ==========================================================

    const body = await request.json();

    const mode: DrawMode =
      body?.mode === "weighted"
        ? "weighted"
        : "random";

    // ==========================================================
    // 5. Get active subscriptions
    // ==========================================================

    const {
      data: subscriptions,
      error: subscriptionError,
    } = await supabase
      .from("subscriptions")
      .select(
        "user_id, amount_paise, current_period_end"
      )
      .eq("status", "active");

    if (subscriptionError) {
      console.error(
        "Subscription lookup error:",
        subscriptionError
      );

      return NextResponse.json(
        {
          error:
            subscriptionError.message,
        },
        { status: 500 }
      );
    }

    if (
      !subscriptions ||
      subscriptions.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "There are no active subscribers eligible for the draw.",
        },
        { status: 400 }
      );
    }

    // ==========================================================
    // 6. Get subscriber IDs
    // ==========================================================

    const userIds = subscriptions.map(
      (subscription) =>
        subscription.user_id
    );

    // ==========================================================
    // 7. Get their scores
    // ==========================================================

    const {
      data: scores,
      error: scoreError,
    } = await supabase
      .from("scores")
      .select(
        "user_id, stableford_score, score_date"
      )
      .in("user_id", userIds)
      .order("score_date", {
        ascending: false,
      });

    if (scoreError) {
      console.error(
        "Score lookup error:",
        scoreError
      );

      return NextResponse.json(
        {
          error: scoreError.message,
        },
        { status: 500 }
      );
    }

    // ==========================================================
    // 8. Build draw participants
    //
    // Only the latest five scores are used.
    // ==========================================================

    const subscribers = subscriptions.map(
      (subscription) => {
        const userScores =
          scores
            ?.filter(
              (score) =>
                score.user_id ===
                subscription.user_id
            )
            .slice(0, 5)
            .map(
              (score) =>
                Number(
                  score.stableford_score
                )
            ) ?? [];

        return {
          userId: subscription.user_id,
          scores: userScores,
        };
      }
    );

    // ==========================================================
    // 9. Calculate active subscription revenue
    // ==========================================================

    const activeSubscriptionRevenuePaise =
      subscriptions.reduce(
        (total, subscription) => {
          return (
            total +
            Number(
              subscription.amount_paise
            )
          );
        },
        0
      );

    // ==========================================================
    // 10. Find previous published draw
    // ==========================================================

    const {
      data: previousDraw,
      error: previousDrawError,
    } = await supabase
      .from("draws")
      .select(
        "id, five_match_pool_paise"
      )
      .eq("status", "published")
      .order("draw_month", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (previousDrawError) {
      console.error(
        "Previous draw lookup error:",
        previousDrawError
      );

      return NextResponse.json(
        {
          error:
            previousDrawError.message,
        },
        { status: 500 }
      );
    }

    // ==========================================================
    // 11. Calculate jackpot rollover
    //
    // Only the 5-match jackpot rolls over.
    // ==========================================================

    let jackpotRolloverPaise = 0;

    if (previousDraw) {
      const {
        count: fiveMatchWinnerCount,
        error: winnerCountError,
      } = await supabase
        .from("winners")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq(
          "draw_id",
          previousDraw.id
        )
        .eq("match_count", 5);

      if (winnerCountError) {
        console.error(
          "Winner count error:",
          winnerCountError
        );

        return NextResponse.json(
          {
            error:
              winnerCountError.message,
          },
          { status: 500 }
        );
      }

      // No 5-match winner means jackpot rolls forward.
      if (
        !fiveMatchWinnerCount ||
        fiveMatchWinnerCount === 0
      ) {
        jackpotRolloverPaise =
          Number(
            previousDraw.five_match_pool_paise
          );
      }
    }

    // ==========================================================
    // 12. Run draw engine
    // ==========================================================

    const simulation = simulateDraw({
      mode,

      subscribers,

      activeSubscriptionRevenuePaise,

      jackpotRolloverPaise,
    });

    // ==========================================================
    // 13. Return simulation
    // ==========================================================

    return NextResponse.json({
      success: true,

      mode,

      simulation,
    });
  } catch (error) {
    console.error(
      "DRAW SIMULATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to simulate draw.",
      },
      { status: 500 }
    );
  }
}