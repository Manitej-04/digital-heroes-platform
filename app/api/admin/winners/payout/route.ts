import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const payoutSchema = z.object({
  winnerId: z.string().uuid(),
});

async function requireAdmin() {
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
    response: null,
  };
}

export async function POST(request: Request) {
  try {
    const { supabase, response } = await requireAdmin();

    if (response) {
      return response;
    }

    const body = await request.json();

    const parsed = payoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid payout request.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { winnerId } = parsed.data;

    const { data: winner, error: winnerError } = await supabase
      .from("winners")
      .select(
        `
          id,
          user_id,
          prize_amount_paise,
          verification_status,
          verified_at,
          paid_at
        `
      )
      .eq("id", winnerId)
      .single();

    if (winnerError || !winner) {
      return NextResponse.json(
        {
          error:
            winnerError?.message ||
            "Winner record not found.",
        },
        { status: 404 }
      );
    }

    if (winner.verification_status === "rejected") {
      return NextResponse.json(
        {
          error:
            "Rejected winners cannot be paid.",
        },
        { status: 400 }
      );
    }

    if (!winner.verified_at) {
      return NextResponse.json(
        {
          error:
            "Winner must be verified before payout.",
        },
        { status: 400 }
      );
    }

    if (
      winner.verification_status === "paid" ||
      winner.paid_at
    ) {
      return NextResponse.json(
        {
          error: "This winner has already been paid.",
        },
        { status: 409 }
      );
    }

    const paidAt = new Date().toISOString();

    const { data: updatedWinner, error } = await supabase
      .from("winners")
      .update({
        verification_status: "paid",
        paid_at: paidAt,
      })
      .eq("id", winnerId)
      .select(
        `
          id,
          user_id,
          prize_amount_paise,
          verification_status,
          verified_at,
          paid_at
        `
      )
      .single();

    if (error) {
      console.error("Winner payout error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Winner marked as paid successfully.",
      winner: updatedWinner,
    });
  } catch (error) {
    console.error("WINNER PAYOUT ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to process payout.",
      },
      { status: 500 }
    );
  }
}