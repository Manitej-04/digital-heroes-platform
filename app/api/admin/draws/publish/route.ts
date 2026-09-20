import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// ============================================================
// VALIDATION
// ============================================================

const winnerSchema = z.object({
  userId: z.string().uuid(),

  matchedNumbers: z
    .array(z.number().int().min(1).max(45)),

  matchCount: z.union([
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),

  prizeTier: z.union([
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.null(),
  ]),

  prizeAmountPaise: z
    .number()
    .int()
    .nonnegative(),
});

const publishSchema = z.object({
  mode: z.union([
    z.literal("random"),
    z.literal("weighted"),
  ]),

  numbers: z
    .array(
      z.number().int().min(1).max(45)
    )
    .length(5),

  eligibleUsers: z
    .number()
    .int()
    .nonnegative(),

  prizePoolPaise: z
    .number()
    .int()
    .nonnegative(),

  fiveMatchPoolPaise: z
    .number()
    .int()
    .nonnegative(),

  fourMatchPoolPaise: z
    .number()
    .int()
    .nonnegative(),

  threeMatchPoolPaise: z
    .number()
    .int()
    .nonnegative(),

  jackpotRolloverPaise: z
    .number()
    .int()
    .nonnegative(),

  winners: z.array(
    winnerSchema
  ),
});

// ============================================================
// POST /api/admin/draws/publish
// ============================================================

export async function POST(
  request: Request
) {
  try {
    // ========================================================
    // 1. Supabase client
    // ========================================================

    const supabase =
      await createClient();

    // ========================================================
    // 2. Authentication
    // ========================================================

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Unauthorized. Please log in.",
        },
        { status: 401 }
      );
    }

    // ========================================================
    // 3. Admin authorization
    // ========================================================

    const {
      data: profile,
      error: profileError,
    } = await supabase
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
          error:
            profileError.message,
        },
        { status: 500 }
      );
    }

    if (profile?.role !== "admin") {
      return NextResponse.json(
        {
          error:
            "Admin access required.",
        },
        { status: 403 }
      );
    }

    // ========================================================
    // 4. Parse request
    // ========================================================

    const body =
      await request.json();

    const parsed =
      publishSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            "Invalid draw data.",
          details:
            parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const simulation =
      parsed.data;

    // ========================================================
    // 5. Validate unique numbers
    // ========================================================

    const uniqueNumbers = [
      ...new Set(
        simulation.numbers
      ),
    ];

    if (
      uniqueNumbers.length !== 5
    ) {
      return NextResponse.json(
        {
          error:
            "Draw numbers must contain exactly five unique numbers.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // 6. Current monthly draw
    // ========================================================

    const now = new Date();

    const drawMonth =
      `${now.getUTCFullYear()}-${String(
        now.getUTCMonth() + 1
      ).padStart(2, "0")}-01`;

    // ========================================================
    // 7. Prevent duplicate monthly draw
    // ========================================================

    const {
      data: existingDraw,
      error: existingDrawError,
    } = await supabase
      .from("draws")
      .select("id, status")
      .eq(
        "draw_month",
        drawMonth
      )
      .maybeSingle();

    if (existingDrawError) {
      console.error(
        "Existing draw lookup error:",
        existingDrawError
      );

      return NextResponse.json(
        {
          error:
            existingDrawError.message,
        },
        { status: 500 }
      );
    }

    if (existingDraw) {
      return NextResponse.json(
        {
          error:
            `A draw already exists for ${drawMonth.slice(
              0,
              7
            )}.`,
        },
        { status: 409 }
      );
    }

    // ========================================================
    // 8. Insert draw
    // ========================================================

    const {
      data: draw,
      error: drawError,
    } = await supabase
      .from("draws")
      .insert({
        draw_month:
          drawMonth,

        mode:
          simulation.mode,

        status:
          "published",

        draw_numbers:
          uniqueNumbers,

        eligible_users:
          simulation.eligibleUsers,

        prize_pool_paise:
          simulation.prizePoolPaise,

        five_match_pool_paise:
          simulation.fiveMatchPoolPaise,

        four_match_pool_paise:
          simulation.fourMatchPoolPaise,

        three_match_pool_paise:
          simulation.threeMatchPoolPaise,

        jackpot_rollover_paise:
          simulation.jackpotRolloverPaise,

        simulation_count: 1,

        published_at:
          now.toISOString(),

        created_by:
          user.id,
      })
      .select("id")
      .single();

    if (
      drawError ||
      !draw
    ) {
      console.error(
        "Draw insert error:",
        drawError
      );

      return NextResponse.json(
        {
          error:
            drawError?.message ||
            "Unable to create draw.",
        },
        { status: 500 }
      );
    }

    // ========================================================
    // 9. Prepare winner records
    // ========================================================

    const winnerRows =
      simulation.winners.map(
        (winner) => ({
          draw_id:
            draw.id,

          user_id:
            winner.userId,

          matched_numbers:
            winner.matchedNumbers,

          match_count:
            winner.matchCount,

          prize_amount_paise:
            winner.prizeAmountPaise,

          verification_status:
            "pending",

          payment_status:
            "pending",
        })
      );

    // ========================================================
    // 10. Insert winners
    // ========================================================

    if (
      winnerRows.length > 0
    ) {
      const {
        error: winnerError,
      } = await supabase
        .from("winners")
        .insert(
          winnerRows
        );

      if (winnerError) {
        console.error(
          "Winner insert error:",
          winnerError
        );

        // Attempt to remove the draw so we don't
        // leave a published draw without its winners.
        await supabase
          .from("draws")
          .delete()
          .eq(
            "id",
            draw.id
          );

        return NextResponse.json(
          {
            error:
              winnerError.message,
          },
          { status: 500 }
        );
      }
    }

    // ========================================================
    // 11. Success
    // ========================================================

    return NextResponse.json({
      success: true,

      message:
        "Draw published successfully.",

      drawId:
        draw.id,

      drawMonth,

      winnerCount:
        winnerRows.length,
    });
  } catch (error) {
    console.error(
      "DRAW PUBLISH ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to publish draw.",
      },
      { status: 500 }
    );
  }
}