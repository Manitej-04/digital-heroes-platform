import Link from "next/link";
import {
    ArrowRight,
    BarChart3,
    CheckCircle2,
    Heart,
    ShieldCheck,
    Trophy,
    UserRound,
} from "lucide-react";

import WinnerEvidenceUpload from "./WinnerEvidenceUpload";
import { createClient } from "@/lib/supabase/server";

function formatMoney(paise: number | null | undefined) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format((paise ?? 0) / 100);
}

function formatDate(value: string | null | undefined) {
    if (!value) return "—";

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(value));
}

function formatMonth(value: string | null | undefined) {
    if (!value) return "Latest Draw";

    return new Intl.DateTimeFormat("en-IN", {
        month: "long",
        year: "numeric",
    }).format(new Date(value));
}

function getVerificationLabel(
    verificationStatus: string | null | undefined,
    verifiedAt: string | null | undefined,
    paidAt: string | null | undefined
) {
    if (paidAt || verificationStatus === "paid") {
        return {
            label: "Paid",
            className:
                "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
        };
    }

    if (verificationStatus === "rejected") {
        return {
            label: "Rejected",
            className: "border-red-400/20 bg-red-400/10 text-red-300",
        };
    }

    if (verifiedAt) {
        return {
            label: "Verified · Payment Pending",
            className:
                "border-amber-400/20 bg-amber-400/10 text-amber-300",
        };
    }

    return {
        label: "Verification Pending",
        className:
            "border-white/10 bg-white/[0.04] text-white/60",
    };
}

export default async function DashboardPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    const [
        { data: profile },
        { data: scores },
        { data: subscription },
        { data: userCharity },
        { data: winnings },
        { data: latestDraw },
    ] = await Promise.all([
        supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single(),

        supabase
            .from("scores")
            .select("id, score_date, stableford_score, created_at")
            .eq("user_id", user.id)
            .order("score_date", { ascending: false })
            .limit(5),

        supabase
            .from("subscriptions")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),

        supabase
            .from("user_charities")
            .select("contribution_percent, charity_id")
            .eq("user_id", user.id)
            .maybeSingle(),

        supabase
            .from("winners")
            .select(
                `
          id,
          draw_id,
          match_count,
          matched_numbers,
          prize_amount_paise,
          verification_status,
          score_screenshot_url,
          admin_notes,
          verified_at,
          paid_at,
          created_at
        `
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(3),

        supabase
            .from("draws")
            .select(
                `
          id,
          draw_month,
          mode,
          draw_numbers,
          prize_pool_paise,
          five_match_pool_paise,
          four_match_pool_paise,
          three_match_pool_paise,
          published_at
        `
            )
            .eq("status", "published")
            .order("draw_month", { ascending: false })
            .limit(1)
            .maybeSingle(),
    ]);

    let charity = null;

    if (userCharity?.charity_id) {
        const { data } = await supabase
            .from("charities")
            .select("name, image_url")
            .eq("id", userCharity.charity_id)
            .maybeSingle();

        charity = data;
    }

    const latestWinner =
        winnings?.find(
            (winner) => winner.draw_id === latestDraw?.id
        ) ?? null;

    const drawNumbers = Array.isArray(latestDraw?.draw_numbers)
        ? latestDraw.draw_numbers
        : [];

    const matchedNumbers = Array.isArray(
        latestWinner?.matched_numbers
    )
        ? latestWinner.matched_numbers
        : [];

    const membershipActive =
        subscription?.status === "active";

    const verification = latestWinner
        ? getVerificationLabel(
            latestWinner.verification_status,
            latestWinner.verified_at,
            latestWinner.paid_at
        )
        : null;

    return (
        <main className="min-h-screen bg-[#07110d] text-white">
            {/* Header */}
            <header className="border-b border-white/10 bg-[#07110d]/95">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                    <Link
                        href="/"
                        className="text-lg font-semibold tracking-tight"
                    >
                        Fairway Impact
                    </Link>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard/scores"
                            className="hidden rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:border-white/20 hover:text-white sm:block"
                        >
                            Scores
                        </Link>

                        <Link
                            href="/dashboard/charity"
                            className="hidden rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:border-white/20 hover:text-white sm:block"
                        >
                            Charity
                        </Link>

                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                            <UserRound size={17} />
                        </div>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-6 py-10">
                {/* Welcome */}
                <section className="mb-8">
                    <p className="mb-2 text-sm font-medium text-emerald-400">
                        Member dashboard
                    </p>

                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        Welcome back
                        {profile?.full_name
                            ? `, ${profile.full_name.split(" ")[0]}`
                            : ""}
                        .
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                        Track your golf scores, subscription, charity impact,
                        and monthly draw results in one place.
                    </p>
                </section>

                {/* Status cards */}
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {/* Membership */}
                    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                        <div className="mb-5 flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                                <ShieldCheck size={19} />
                            </div>

                            <span
                                className={`rounded-full border px-2.5 py-1 text-xs ${membershipActive
                                    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                                    : "border-white/10 bg-white/[0.04] text-white/50"
                                    }`}
                            >
                                {subscription?.status ?? "Inactive"}
                            </span>
                        </div>

                        <p className="text-sm text-white/50">
                            Membership
                        </p>

                        <p className="mt-1 text-xl font-semibold">
                            {subscription?.plan
                                ? subscription.plan.charAt(0).toUpperCase() +
                                subscription.plan.slice(1)
                                : "No plan"}
                        </p>

                        {subscription?.amount_paise ? (
                            <p className="mt-1 text-xs text-white/40">
                                {formatMoney(subscription.amount_paise)}
                            </p>
                        ) : null}
                    </div>

                    {/* Scores */}
                    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                        <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300">
                            <BarChart3 size={19} />
                        </div>

                        <p className="text-sm text-white/50">
                            Recent scores
                        </p>

                        <p className="mt-1 text-xl font-semibold">
                            {scores?.length ?? 0}/5
                        </p>

                        <p className="mt-1 text-xs text-white/40">
                            Latest Stableford rounds
                        </p>
                    </div>

                    {/* Charity */}
                    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                        <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-400/10 text-pink-300">
                            <Heart size={19} />
                        </div>

                        <p className="text-sm text-white/50">
                            Charity
                        </p>

                        <p className="mt-1 truncate text-xl font-semibold">
                            {charity?.name ?? "Not selected"}
                        </p>

                        <p className="mt-1 text-xs text-white/40">
                            {userCharity?.contribution_percent ?? 10}% contribution
                        </p>
                    </div>

                    {/* Winnings */}
                    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                        <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
                            <Trophy size={19} />
                        </div>

                        <p className="text-sm text-white/50">
                            Recent winnings
                        </p>

                        <p className="mt-1 text-xl font-semibold">
                            {winnings?.length ?? 0}
                        </p>

                        <p className="mt-1 text-xs text-white/40">
                            Draw result records
                        </p>
                    </div>
                </section>

                {/* Latest Draw */}
                <section className="mt-6 rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-emerald-400/[0.08] via-white/[0.025] to-white/[0.02] p-6">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                                    Latest published draw
                                </span>

                                {latestDraw?.mode ? (
                                    <span className="text-xs capitalize text-white/40">
                                        {latestDraw.mode} draw
                                    </span>
                                ) : null}
                            </div>

                            <h2 className="mt-4 text-2xl font-semibold">
                                {formatMonth(latestDraw?.draw_month)}
                            </h2>

                            <p className="mt-1 text-sm text-white/45">
                                {latestDraw?.published_at
                                    ? `Published ${formatDate(
                                        latestDraw.published_at
                                    )}`
                                    : "Draw results"}
                            </p>
                        </div>

                        {latestDraw ? (
                            <div className="flex flex-wrap gap-2">
                                {drawNumbers.map(
                                    (number: number, index: number) => {
                                        const isMatched =
                                            matchedNumbers.includes(number);

                                        return (
                                            <div
                                                key={`${number}-${index}`}
                                                className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-base font-semibold ${isMatched
                                                    ? "border-emerald-300 bg-emerald-300 text-[#07110d]"
                                                    : "border-white/10 bg-white/[0.05] text-white"
                                                    }`}
                                            >
                                                {number}
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-white/45">
                                No published draw is available yet.
                            </div>
                        )}
                    </div>

                    {latestDraw ? (
                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                                <p className="text-xs text-white/40">
                                    Total prize pool
                                </p>
                                <p className="mt-1 text-lg font-semibold">
                                    {formatMoney(
                                        latestDraw.prize_pool_paise
                                    )}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                                <p className="text-xs text-white/40">
                                    5-match pool
                                </p>
                                <p className="mt-1 text-lg font-semibold">
                                    {formatMoney(
                                        latestDraw.five_match_pool_paise
                                    )}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                                <p className="text-xs text-white/40">
                                    Your result
                                </p>
                                <p className="mt-1 text-lg font-semibold">
                                    {latestWinner
                                        ? `${latestWinner.match_count} matches`
                                        : "No winning result"}
                                </p>
                            </div>
                        </div>
                    ) : null}
                </section>

                {/* Main content */}
                <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
                    {/* Scores */}
                    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-white/50">
                                    Performance
                                </p>
                                <h2 className="mt-1 text-xl font-semibold">
                                    Latest scores
                                </h2>
                            </div>

                            <Link
                                href="/dashboard/scores"
                                className="flex items-center gap-1 text-sm text-emerald-300 transition hover:text-emerald-200"
                            >
                                Manage
                                <ArrowRight size={15} />
                            </Link>
                        </div>

                        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
                            {scores && scores.length > 0 ? (
                                scores.map((score, index) => (
                                    <div
                                        key={score.id}
                                        className={`flex items-center justify-between px-4 py-4 ${index !== scores.length - 1
                                            ? "border-b border-white/10"
                                            : ""
                                            }`}
                                    >
                                        <div>
                                            <p className="text-sm font-medium">
                                                {formatDate(score.score_date)}
                                            </p>

                                            <p className="mt-1 text-xs text-white/40">
                                                Stableford round
                                            </p>
                                        </div>

                                        <div className="rounded-xl bg-white/[0.06] px-3 py-2 text-sm font-semibold">
                                            {score.stableford_score}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-8 text-center text-sm text-white/40">
                                    No scores added yet.
                                </div>
                            )}
                        </div>

                        <Link
                            href="/dashboard/scores"
                            className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.04] hover:text-white"
                        >
                            Add or edit scores
                            <ArrowRight size={15} />
                        </Link>
                    </div>

                    {/* Membership */}
                    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
                        <p className="text-sm font-medium text-white/50">
                            Membership
                        </p>

                        <h2 className="mt-1 text-xl font-semibold">
                            Subscription
                        </h2>

                        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-white/50">
                                    Status
                                </span>

                                <span
                                    className={`rounded-full px-2.5 py-1 text-xs ${membershipActive
                                        ? "bg-emerald-400/10 text-emerald-300"
                                        : "bg-white/10 text-white/50"
                                        }`}
                                >
                                    {subscription?.status ?? "Inactive"}
                                </span>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-sm text-white/50">
                                    Plan
                                </span>

                                <span className="text-sm font-medium capitalize">
                                    {subscription?.plan ?? "—"}
                                </span>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-sm text-white/50">
                                    Amount
                                </span>

                                <span className="text-sm font-medium">
                                    {subscription?.amount_paise
                                        ? formatMoney(
                                            subscription.amount_paise
                                        )
                                        : "—"}
                                </span>
                            </div>
                        </div>

                        {!membershipActive ? (
                            <Link
                                href="/subscribe"
                                className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-[#07110d] transition hover:bg-emerald-300"
                            >
                                Subscribe
                                <ArrowRight size={15} />
                            </Link>
                        ) : null}
                    </div>
                </section>

                {/* Charity + Latest Result */}
                <section className="mt-6 grid gap-6 lg:grid-cols-2">
                    {/* Charity */}
                    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-white/50">
                                    Your impact
                                </p>

                                <h2 className="mt-1 text-xl font-semibold">
                                    Charity
                                </h2>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-400/10 text-pink-300">
                                <Heart size={18} />
                            </div>
                        </div>

                        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                            <p className="text-xs text-white/40">
                                Selected charity
                            </p>

                            <p className="mt-1 text-lg font-semibold">
                                {charity?.name ?? "No charity selected"}
                            </p>

                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-sm text-white/45">
                                    Contribution
                                </span>

                                <span className="text-sm font-semibold text-emerald-300">
                                    {userCharity?.contribution_percent ?? 10}%
                                </span>
                            </div>
                        </div>

                        <Link
                            href="/dashboard/charity"
                            className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.04] hover:text-white"
                        >
                            Manage charity
                            <ArrowRight size={15} />
                        </Link>
                    </div>

                    {/* Latest Result */}
                    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-white/50">
                                    Draw result
                                </p>

                                <h2 className="mt-1 text-xl font-semibold">
                                    Your latest result
                                </h2>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
                                <Trophy size={18} />
                            </div>
                        </div>

                        {latestWinner ? (
                            <div className="mt-5">
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-xs text-white/40">
                                            Matched numbers
                                        </p>

                                        <p className="mt-1 text-3xl font-semibold">
                                            {latestWinner.match_count}
                                            <span className="ml-1 text-base font-normal text-white/35">
                                                / 5
                                            </span>
                                        </p>
                                    </div>

                                    <p className="text-lg font-semibold text-emerald-300">
                                        {formatMoney(
                                            latestWinner.prize_amount_paise
                                        )}
                                    </p>
                                </div>

                                {matchedNumbers.length > 0 ? (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {matchedNumbers.map(
                                            (number: number, index: number) => (
                                                <span
                                                    key={`${number}-${index}`}
                                                    className="rounded-xl bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-300"
                                                >
                                                    {number}
                                                </span>
                                            )
                                        )}
                                    </div>
                                ) : null}

                                {verification ? (
                                    <div className="mt-4 flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full border px-3 py-1.5 text-xs ${verification.className}`}
                                        >
                                            {verification.label}
                                        </span>

                                        {latestWinner.paid_at ? (
                                            <span className="text-xs text-white/35">
                                                Payout completed
                                            </span>
                                        ) : latestWinner.score_screenshot_url ? (
                                            <span className="text-xs text-emerald-300/80">
                                                Evidence submitted
                                            </span>
                                        ) : (
                                            <span className="text-xs text-amber-300/70">
                                                Evidence required
                                            </span>
                                        )}
                                    </div>
                                ) : null}
                                <WinnerEvidenceUpload
                                    winnerId={latestWinner.id}
                                    userId={user.id}
                                    existingEvidence={
                                        latestWinner.score_screenshot_url
                                    }
                                    disabled={Boolean(latestWinner.paid_at)}
                                />

                                {latestWinner.admin_notes ? (
                                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.025] p-3">
                                        <p className="text-xs text-white/40">
                                            Admin note
                                        </p>

                                        <p className="mt-1 text-sm leading-5 text-white/60">
                                            {latestWinner.admin_notes}
                                        </p>
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                                <p className="text-sm text-white/55">
                                    You do not have a winning result for the
                                    latest published draw.
                                </p>

                                <p className="mt-2 text-xs leading-5 text-white/35">
                                    Keep your latest five Stableford scores
                                    updated to participate in future draws.
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Recent winnings */}
                <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-white/50">
                                History
                            </p>

                            <h2 className="mt-1 text-xl font-semibold">
                                Recent winnings
                            </h2>
                        </div>

                        <Trophy
                            size={20}
                            className="text-amber-300"
                        />
                    </div>

                    <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
                        {winnings && winnings.length > 0 ? (
                            winnings.map((winner, index) => {
                                const status = getVerificationLabel(
                                    winner.verification_status,
                                    winner.verified_at,
                                    winner.paid_at
                                );

                                return (
                                    <div
                                        key={winner.id}
                                        className={`flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${index !== winnings.length - 1
                                            ? "border-b border-white/10"
                                            : ""
                                            }`}
                                    >
                                        <div>
                                            <p className="text-sm font-medium">
                                                {winner.match_count} matches
                                            </p>

                                            <p className="mt-1 text-xs text-white/40">
                                                {formatDate(winner.created_at)}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <span
                                                className={`rounded-full border px-2.5 py-1 text-xs ${status.className}`}
                                            >
                                                {status.label}
                                            </span>

                                            <span className="min-w-[90px] text-right text-sm font-semibold text-emerald-300">
                                                {formatMoney(
                                                    winner.prize_amount_paise
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="px-4 py-8 text-center text-sm text-white/40">
                                No winnings recorded yet.
                            </div>
                        )}
                    </div>
                </section>

                {/* Bottom navigation */}
                <section className="mt-6 grid gap-4 sm:grid-cols-2">
                    <Link
                        href="/dashboard/scores"
                        className="group rounded-3xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-emerald-400/20 hover:bg-white/[0.05]"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">
                                    Keep your scores updated
                                </p>

                                <p className="mt-1 text-sm text-white/40">
                                    Maintain your latest five Stableford rounds.
                                </p>
                            </div>

                            <ArrowRight
                                size={18}
                                className="text-white/35 transition group-hover:translate-x-1 group-hover:text-emerald-300"
                            />
                        </div>
                    </Link>

                    <Link
                        href="/dashboard/charity"
                        className="group rounded-3xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-pink-400/20 hover:bg-white/[0.05]"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">
                                    Manage your impact
                                </p>

                                <p className="mt-1 text-sm text-white/40">
                                    Choose your charity and contribution level.
                                </p>
                            </div>

                            <ArrowRight
                                size={18}
                                className="text-white/35 transition group-hover:translate-x-1 group-hover:text-pink-300"
                            />
                        </div>
                    </Link>
                </section>
            </div>
        </main>
    );
}