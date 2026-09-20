import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const evidenceSchema = z.object({
  winnerId: z.string().uuid(),
  filePath: z.string().min(1).max(500),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const parsed = evidenceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid evidence request.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { winnerId, filePath } = parsed.data;

    const expectedPrefix = `${user.id}/`;

    if (!filePath.startsWith(expectedPrefix)) {
      return NextResponse.json(
        {
          error:
            "You can only upload evidence belonging to your account.",
        },
        { status: 403 }
      );
    }

    const { data: winner, error: winnerError } = await supabase
      .from("winners")
      .select(
        `
          id,
          user_id,
          verification_status,
          score_screenshot_url,
          paid_at
        `
      )
      .eq("id", winnerId)
      .eq("user_id", user.id)
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

    if (winner.paid_at || winner.verification_status === "paid") {
      return NextResponse.json(
        {
          error:
            "Evidence cannot be changed after payout.",
        },
        { status: 400 }
      );
    }

    const { data: updatedWinner, error: updateError } =
      await supabase
        .from("winners")
        .update({
          score_screenshot_url: filePath,
        })
        .eq("id", winnerId)
        .eq("user_id", user.id)
        .select(
          `
            id,
            score_screenshot_url,
            verification_status,
            verified_at,
            paid_at
          `
        )
        .single();

    if (updateError) {
      console.error(
        "Winner evidence update error:",
        updateError
      );

      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Winner evidence uploaded successfully.",
      winner: updatedWinner,
    });
  } catch (error) {
    console.error("WINNER EVIDENCE ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to upload winner evidence.",
      },
      { status: 500 }
    );
  }
}