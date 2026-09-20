import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getAdminClient() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      response: NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      ),
    };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error) {
    return {
      supabase,
      response: NextResponse.json(
        { error: error.message },
        { status: 500 }
      ),
    };
  }

  if (profile?.role !== "admin") {
    return {
      supabase,
      response: NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      ),
    };
  }

  return {
    supabase,
    user,
    response: null,
  };
}

export async function GET() {
  try {
    const { supabase, response } = await getAdminClient();

    if (response) {
      return response;
    }

    const { data: winners, error: winnersError } = await supabase
      .from("winners")
      .select(
        `
          id,
          draw_result_id,
          user_id,
          draw_id,
          match_count,
          prize_amount_paise,
          verification_status,
          score_screenshot_url,
          admin_notes,
          verified_at,
          paid_at,
          created_at
        `
      )
      .order("created_at", { ascending: false });

    if (winnersError) {
      console.error("Winner lookup error:", winnersError);

      return NextResponse.json(
        { error: winnersError.message },
        { status: 500 }
      );
    }

    if (!winners || winners.length === 0) {
      return NextResponse.json({
        success: true,
        winners: [],
      });
    }

    const drawIds = [
      ...new Set(winners.map((winner) => winner.draw_id)),
    ];

    const resultIds = [
      ...new Set(winners.map((winner) => winner.draw_result_id)),
    ];

    const [{ data: draws, error: drawsError }, { data: results, error: resultsError }] =
      await Promise.all([
        supabase
          .from("draws")
          .select(
            "id, draw_month, mode, draw_numbers, prize_pool_paise"
          )
          .in("id", drawIds),

        supabase
          .from("draw_results")
          .select(
            "id, draw_id, user_id, matched_numbers, match_count, prize_tier, prize_amount_paise"
          )
          .in("id", resultIds),
      ]);

    if (drawsError) {
      return NextResponse.json(
        { error: drawsError.message },
        { status: 500 }
      );
    }

    if (resultsError) {
      return NextResponse.json(
        { error: resultsError.message },
        { status: 500 }
      );
    }

    const drawMap = new Map(
      (draws ?? []).map((draw) => [draw.id, draw])
    );

    const resultMap = new Map(
      (results ?? []).map((result) => [result.id, result])
    );

    const enrichedWinners = winners.map((winner) => ({
      ...winner,
      draw: drawMap.get(winner.draw_id) ?? null,
      drawResult: resultMap.get(winner.draw_result_id) ?? null,
    }));

    return NextResponse.json({
      success: true,
      winners: enrichedWinners,
    });
  } catch (error) {
    console.error("WINNERS API ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load winners.",
      },
      { status: 500 }
    );
  }
}