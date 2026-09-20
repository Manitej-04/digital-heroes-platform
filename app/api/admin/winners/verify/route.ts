import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const verifySchema = z.object({
  winnerId: z.string().uuid(),
  action: z.union([
    z.literal("approve"),
    z.literal("reject"),
  ]),
  adminNotes: z.string().max(2000).optional(),
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

    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid verification request.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { winnerId, action, adminNotes } = parsed.data;

    const { data: winner, error: winnerError } = await supabase
      .from("winners")
      .select(
        "id, verification_status, verified_at, paid_at"
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

    if (winner.verification_status === "paid") {
      return NextResponse.json(
        {
          error: "This winner has already been paid.",
        },
        { status: 400 }
      );
    }

    if (winner.paid_at) {
      return NextResponse.json(
        {
          error: "This winner has already been paid.",
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    if (action === "approve") {
      const { data: updatedWinner, error } = await supabase
        .from("winners")
        .update({
          verification_status: "pending",
          verified_at: now,
          admin_notes: adminNotes?.trim() || null,
        })
        .eq("id", winnerId)
        .select(
          "id, verification_status, verified_at, admin_notes"
        )
        .single();

      if (error) {
        console.error("Winner approval error:", error);

        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message:
          "Winner verified successfully. Payment is still pending.",
        winner: updatedWinner,
      });
    }

    const { data: updatedWinner, error } = await supabase
      .from("winners")
      .update({
        verification_status: "rejected",
        verified_at: now,
        admin_notes: adminNotes?.trim() || null,
      })
      .eq("id", winnerId)
      .select(
        "id, verification_status, verified_at, admin_notes"
      )
      .single();

    if (error) {
      console.error("Winner rejection error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Winner rejected.",
      winner: updatedWinner,
    });
  } catch (error) {
    console.error("WINNER VERIFICATION ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update winner verification.",
      },
      { status: 500 }
    );
  }
}