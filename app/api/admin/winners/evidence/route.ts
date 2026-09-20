import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const filePath =
      typeof body?.filePath === "string"
        ? body.filePath.trim()
        : "";

    if (!filePath) {
      return NextResponse.json(
        { error: "Evidence file path is required." },
        { status: 400 }
      );
    }

    if (filePath.includes("..")) {
      return NextResponse.json(
        { error: "Invalid evidence path." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.storage
      .from("winner-evidence")
      .createSignedUrl(filePath, 60 * 10);

    if (error || !data?.signedUrl) {
      console.error(
        "Evidence signed URL error:",
        error
      );

      return NextResponse.json(
        {
          error:
            error?.message ||
            "Unable to create evidence URL.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl,
    });
  } catch (error) {
    console.error(
      "WINNER EVIDENCE VIEW ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to open winner evidence.",
      },
      { status: 500 }
    );
  }
}