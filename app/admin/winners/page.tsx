"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  DollarSign,
  ExternalLink,
  FileCheck2,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";

type Winner = {
  id: string;
  draw_result_id: string;
  user_id: string;
  draw_id: string;
  match_count: number;
  prize_amount_paise: number;
  verification_status: "pending" | "paid" | "rejected";
  score_screenshot_url: string | null;
  admin_notes: string | null;
  verified_at: string | null;
  paid_at: string | null;
  created_at: string;
  draw: {
    id: string;
    draw_month: string;
    mode: string;
    draw_numbers: number[];
    prize_pool_paise: number;
  } | null;
  drawResult: {
    id: string;
    draw_id: string;
    user_id: string;
    matched_numbers: number[];
    match_count: number;
    prize_tier: number | null;
    prize_amount_paise: number;
  } | null;
};

type ActionState = {
  id: string;
  action: "approve" | "reject" | "payout";
} | null;

function formatRupees(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

function formatMonth(value?: string) {
  if (!value) return "—";

  return new Date(`${value}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      month: "long",
      year: "numeric",
    }
  );
}

function shortId(value: string) {
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

export default function AdminWinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionState, setActionState] =
    useState<ActionState>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadWinners() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/winners", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load winners."
        );
      }

      setWinners(data.winners ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load winners."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleViewEvidence(filePath: string) {
    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/admin/winners/evidence",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filePath,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Unable to open winner evidence."
        );
      }

      window.open(
        data.signedUrl,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to open winner evidence."
      );
    }
  }

  useEffect(() => {
    loadWinners();
  }, []);

  async function handleVerification(
    winnerId: string,
    action: "approve" | "reject"
  ) {
    try {
      setActionState({
        id: winnerId,
        action,
      });

      setError("");
      setSuccess("");

      const adminNotes =
        action === "reject"
          ? window.prompt(
            "Reason for rejection (optional):"
          ) ?? ""
          : "";

      const response = await fetch(
        "/api/admin/winners/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            winnerId,
            action,
            adminNotes,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Unable to update winner verification."
        );
      }

      setSuccess(data.message);
      await loadWinners();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update winner."
      );
    } finally {
      setActionState(null);
    }
  }

  async function handlePayout(winnerId: string) {
    const confirmed = window.confirm(
      "Confirm that this winner has been paid?"
    );

    if (!confirmed) return;

    try {
      setActionState({
        id: winnerId,
        action: "payout",
      });

      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/admin/winners/payout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            winnerId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to process payout."
        );
      }

      setSuccess(data.message);
      await loadWinners();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to process payout."
      );
    } finally {
      setActionState(null);
    }
  }

  const stats = useMemo(() => {
    const pending = winners.filter(
      (winner) =>
        winner.verification_status === "pending" &&
        !winner.verified_at
    ).length;

    const verified = winners.filter(
      (winner) =>
        winner.verification_status === "pending" &&
        !!winner.verified_at
    ).length;

    const paid = winners.filter(
      (winner) =>
        winner.verification_status === "paid"
    ).length;

    const totalPrize = winners.reduce(
      (sum, winner) =>
        sum + Number(winner.prize_amount_paise),
      0
    );

    return {
      pending,
      verified,
      paid,
      totalPrize,
    };
  }, [winners]);

  return (
    <main className="min-h-screen bg-[#07110d] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-emerald-400">
              Administration
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Winner Verification & Payouts
            </h1>

            <p className="mt-3 text-slate-400">
              Review draw winners, verify score evidence,
              and record completed payouts.
            </p>
          </div>

          <button
            type="button"
            onClick={loadWinners}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-emerald-400/30 hover:bg-emerald-400/10 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                loading ? "animate-spin" : ""
              }
            />
            Refresh
          </button>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-300">
            {success}
          </div>
        )}

        {/* STATS */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            icon={ShieldCheck}
            label="Total winners"
            value={winners.length}
          />

          <StatCard
            icon={Clock3}
            label="Awaiting verification"
            value={stats.pending}
          />

          <StatCard
            icon={FileCheck2}
            label="Verified"
            value={stats.verified}
          />

          <StatCard
            icon={DollarSign}
            label="Paid"
            value={stats.paid}
          />

          <StatCard
            icon={DollarSign}
            label="Prize value"
            value={formatRupees(stats.totalPrize)}
          />
        </section>

        {/* CONTENT */}
        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-16 text-center">
            <RefreshCw
              size={28}
              className="mx-auto animate-spin text-emerald-400"
            />

            <p className="mt-4 text-sm text-slate-500">
              Loading winners…
            </p>
          </div>
        ) : winners.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-400/10">
              <ShieldCheck
                size={32}
                className="text-emerald-400"
              />
            </div>

            <h2 className="mt-6 text-xl font-semibold">
              No winners yet
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Published draws will appear here when
              subscribers match 3, 4, or 5 draw numbers.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {winners.map((winner) => {
              const isPending =
                winner.verification_status ===
                "pending" &&
                !winner.verified_at;

              const isVerified =
                winner.verification_status ===
                "pending" &&
                !!winner.verified_at;

              const isPaid =
                winner.verification_status === "paid";

              const isRejected =
                winner.verification_status ===
                "rejected";

              return (
                <section
                  key={winner.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]"
                >
                  {/* WINNER HEADER */}
                  <div className="border-b border-white/10 px-6 py-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                            {winner.match_count}-Match Winner
                          </span>

                          {isPending && (
                            <StatusBadge
                              label="Awaiting verification"
                              type="pending"
                            />
                          )}

                          {isVerified && (
                            <StatusBadge
                              label="Verified · Payment pending"
                              type="verified"
                            />
                          )}

                          {isPaid && (
                            <StatusBadge
                              label="Paid"
                              type="paid"
                            />
                          )}

                          {isRejected && (
                            <StatusBadge
                              label="Rejected"
                              type="rejected"
                            />
                          )}
                        </div>

                        <h2 className="mt-3 text-lg font-semibold text-white">
                          {formatMonth(
                            winner.draw?.draw_month
                          )}
                        </h2>

                        <p className="mt-1 text-xs text-slate-600">
                          User: {shortId(winner.user_id)}
                        </p>
                      </div>

                      <div className="lg:text-right">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
                          Prize
                        </p>

                        <p className="mt-1 text-2xl font-bold text-white">
                          {formatRupees(
                            winner.prize_amount_paise
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* WINNER DETAILS */}
                  <div className="grid gap-6 px-6 py-6 lg:grid-cols-3">
                    <DetailBlock title="Draw numbers">
                      <div className="flex flex-wrap gap-2">
                        {(
                          winner.draw?.draw_numbers ?? []
                        ).map((number) => (
                          <NumberBadge
                            key={number}
                            number={number}
                          />
                        ))}
                      </div>
                    </DetailBlock>

                    <DetailBlock title="Matched numbers">
                      <div className="flex flex-wrap gap-2">
                        {(
                          winner.drawResult
                            ?.matched_numbers ?? []
                        ).map((number) => (
                          <NumberBadge
                            key={number}
                            number={number}
                            matched
                          />
                        ))}
                      </div>

                      <p className="mt-2 text-xs text-slate-600">
                        {winner.match_count} of 5 numbers
                        matched
                      </p>
                    </DetailBlock>

                    <DetailBlock title="Score evidence">
                      {winner.score_screenshot_url ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleViewEvidence(
                              winner.score_screenshot_url!
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-slate-300 transition hover:border-emerald-400/30 hover:text-emerald-400"
                        >
                          View screenshot
                          <ExternalLink size={15} />
                        </button>
                      ) : (
                        <p className="text-sm text-slate-600">
                          No screenshot submitted
                        </p>
                      )}
                    </DetailBlock>
                  </div>

                  {/* ADMIN NOTES */}
                  {winner.admin_notes && (
                    <div className="border-t border-white/10 bg-white/[0.015] px-6 py-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Admin notes
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {winner.admin_notes}
                      </p>
                    </div>
                  )}

                  {/* ACTIONS */}
                  <div className="flex flex-col gap-3 border-t border-white/10 bg-black/10 px-6 py-4 sm:flex-row sm:justify-end">
                    {isPending && (
                      <>
                        <button
                          type="button"
                          disabled={
                            actionState?.id ===
                            winner.id
                          }
                          onClick={() =>
                            handleVerification(
                              winner.id,
                              "reject"
                            )
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
                        >
                          <XCircle size={16} />
                          Reject
                        </button>

                        <button
                          type="button"
                          disabled={
                            actionState?.id ===
                            winner.id
                          }
                          onClick={() =>
                            handleVerification(
                              winner.id,
                              "approve"
                            )
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
                        >
                          <CheckCircle2 size={16} />
                          Verify Winner
                        </button>
                      </>
                    )}

                    {isVerified && (
                      <button
                        type="button"
                        disabled={
                          actionState?.id === winner.id
                        }
                        onClick={() =>
                          handlePayout(winner.id)
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
                      >
                        <DollarSign size={16} />
                        Mark as Paid
                      </button>
                    )}

                    {isPaid && (
                      <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-400/10 px-4 py-2.5 text-sm font-semibold text-emerald-400">
                        <CheckCircle2 size={16} />
                        Payment completed
                      </div>
                    )}

                    {isRejected && (
                      <div className="inline-flex items-center gap-2 rounded-xl bg-red-400/10 px-4 py-2.5 text-sm font-semibold text-red-300">
                        <XCircle size={16} />
                        Winner rejected
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-emerald-400/20">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10">
        <Icon
          size={19}
          className="text-emerald-400"
        />
      </div>

      <p className="mt-5 text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

function DetailBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
        {title}
      </p>

      {children}
    </div>
  );
}

function NumberBadge({
  number,
  matched = false,
}: {
  number: number;
  matched?: boolean;
}) {
  return (
    <span
      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${matched
        ? "bg-emerald-400 text-slate-950"
        : "border border-white/10 bg-white/[0.04] text-slate-300"
        }`}
    >
      {number}
    </span>
  );
}

function StatusBadge({
  label,
  type,
}: {
  label: string;
  type: "pending" | "verified" | "paid" | "rejected";
}) {
  const classes = {
    pending:
      "bg-amber-400/10 text-amber-300",
    verified:
      "bg-blue-400/10 text-blue-300",
    paid:
      "bg-emerald-400/10 text-emerald-400",
    rejected:
      "bg-red-400/10 text-red-300",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${classes[type]}`}
    >
      {label}
    </span>
  );
}