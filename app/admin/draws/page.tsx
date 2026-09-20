"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calculator,
  CheckCircle2,
  Dice5,
  Loader2,
  RefreshCw,
  Trophy,
  Users,
  Zap,
  Send,
  AlertTriangle,
} from "lucide-react";

type DrawMode = "random" | "weighted";

type Winner = {
  userId: string;
  matchedNumbers: number[];
  matchCount: number;
  prizeTier: 3 | 4 | 5 | null;
  prizeAmountPaise: number;
};

type Simulation = {
  numbers: number[];
  eligibleUsers: number;
  prizePoolPaise: number;
  fiveMatchPoolPaise: number;
  fourMatchPoolPaise: number;
  threeMatchPoolPaise: number;
  jackpotRolloverPaise: number;
  winners: Winner[];
};

export default function AdminDrawsPage() {
  const [mode, setMode] =
    useState<DrawMode>("random");

  const [simulation, setSimulation] =
    useState<Simulation | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [publishing, setPublishing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ==========================================================
  // SIMULATION
  // ==========================================================

  async function runSimulation() {
    setLoading(true);
    setError("");
    setSuccess("");
    setSimulation(null);

    try {
      const response = await fetch(
        "/api/admin/draws/simulate",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            mode,
          }),
        }
      );

      const responseText =
        await response.text();

      let data: {
        success?: boolean;
        simulation?: Simulation;
        error?: string;
      };

      try {
        data =
          JSON.parse(responseText);
      } catch {
        throw new Error(
          `Draw API returned ${response.status}. The server did not return JSON.`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Simulation failed with status ${response.status}.`
        );
      }

      if (!data.simulation) {
        throw new Error(
          "The API returned successfully but no simulation result was provided."
        );
      }

      setSimulation(
        data.simulation
      );
    } catch (err) {
      console.error(
        "Draw simulation failed:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Simulation failed."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // PUBLISH
  // ==========================================================

  async function publishDraw() {
    if (!simulation) {
      return;
    }

    const confirmed =
      window.confirm(
        "Publish this draw? This will permanently create the monthly draw and its winner records."
      );

    if (!confirmed) {
      return;
    }

    setPublishing(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/admin/draws/publish",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            mode,

            numbers:
              simulation.numbers,

            eligibleUsers:
              simulation.eligibleUsers,

            prizePoolPaise:
              simulation.prizePoolPaise,

            fiveMatchPoolPaise:
              simulation.fiveMatchPoolPaise,

            fourMatchPoolPaise:
              simulation.fourMatchPoolPaise,

            threeMatchPoolPaise:
              simulation.threeMatchPoolPaise,

            jackpotRolloverPaise:
              simulation.jackpotRolloverPaise,

            winners:
              simulation.winners,
          }),
        }
      );

      const responseText =
        await response.text();

      let data: {
        success?: boolean;
        message?: string;
        drawId?: string;
        drawMonth?: string;
        winnerCount?: number;
        error?: string;
      };

      try {
        data =
          JSON.parse(responseText);
      } catch {
        throw new Error(
          `Publish API returned ${response.status} but did not return JSON.`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Publishing failed with status ${response.status}.`
        );
      }

      setSuccess(
        `Draw published successfully for ${data.drawMonth}. ${
          data.winnerCount ?? 0
        } winner(s) recorded.`
      );
    } catch (err) {
      console.error(
        "Draw publish failed:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to publish draw."
      );
    } finally {
      setPublishing(false);
    }
  }

  // ==========================================================
  // MONEY
  // ==========================================================

  function formatMoney(
    paise: number
  ) {
    return `₹${(
      paise / 100
    ).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return (
    <main className="min-h-screen bg-[#07110d] text-white">
      {/* HEADER */}
      <header className="border-b border-white/5">
        <div className="mx-auto flex max-w-7xl items-center px-6 py-5">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Admin
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* TITLE */}
        <div>
          <p className="text-sm font-medium text-emerald-400">
            Draw management
          </p>

          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
            Monthly Hero Draw
          </h1>

          <p className="mt-3 max-w-2xl text-slate-500">
            Configure the draw algorithm, simulate the results and
            review the prize distribution before publishing.
          </p>
        </div>

        {/* CONFIGURATION */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.025] p-6">
          <div className="flex items-center gap-3">
            <Dice5
              size={20}
              className="text-emerald-400"
            />

            <h2 className="text-xl font-semibold">
              Draw configuration
            </h2>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                setMode("random")
              }
              disabled={publishing}
              className={`rounded-2xl border p-5 text-left transition ${
                mode === "random"
                  ? "border-emerald-400/40 bg-emerald-400/5"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                  <Dice5 size={19} />
                </div>

                {mode === "random" && (
                  <CheckCircle2
                    size={19}
                    className="text-emerald-400"
                  />
                )}
              </div>

              <h3 className="mt-5 font-semibold">
                Standard Random
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Generate five unique numbers randomly from 1–45.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                setMode("weighted")
              }
              disabled={publishing}
              className={`rounded-2xl border p-5 text-left transition ${
                mode === "weighted"
                  ? "border-emerald-400/40 bg-emerald-400/5"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                  <Zap size={19} />
                </div>

                {mode === "weighted" && (
                  <CheckCircle2
                    size={19}
                    className="text-emerald-400"
                  />
                )}
              </div>

              <h3 className="mt-5 font-semibold">
                Score Weighted
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Weight numbers according to the frequency of subscriber
                Stableford scores.
              </p>
            </button>
          </div>

          <button
            type="button"
            onClick={runSimulation}
            disabled={
              loading ||
              publishing
            }
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />

                Running simulation...
              </>
            ) : (
              <>
                <Calculator size={17} />

                Run draw simulation
              </>
            )}
          </button>

          {error && (
            <div className="mt-5 flex gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
              <AlertTriangle
                size={18}
                className="shrink-0"
              />

              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-5 flex gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300">
              <CheckCircle2
                size={18}
                className="shrink-0"
              />

              <p>{success}</p>
            </div>
          )}
        </section>

        {/* RESULTS */}
        {simulation && (
          <>
            {/* SUMMARY */}
            <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                icon={Dice5}
                label="Draw numbers"
                value={simulation.numbers.join(
                  " · "
                )}
              />

              <Stat
                icon={Users}
                label="Eligible users"
                value={
                  simulation.eligibleUsers
                }
              />

              <Stat
                icon={Trophy}
                label="Prize pool"
                value={formatMoney(
                  simulation.prizePoolPaise
                )}
              />

              <Stat
                icon={Zap}
                label="Potential winners"
                value={
                  simulation.winners.length
                }
              />
            </section>

            {/* DRAW NUMBERS */}
            <section className="mt-6 rounded-3xl border border-emerald-400/10 bg-emerald-400/5 p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-600">
                    Simulated result
                  </p>

                  <h2 className="mt-2 text-xl font-semibold">
                    Draw numbers
                  </h2>
                </div>

                <RefreshCw
                  size={19}
                  className="text-emerald-400"
                />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {simulation.numbers.map(
                  (number) => (
                    <div
                      key={number}
                      className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/20 bg-[#07110d] text-xl font-bold text-emerald-400"
                    >
                      {number}
                    </div>
                  )
                )}
              </div>
            </section>

            {/* PRIZE POOLS */}
            <section className="mt-6 grid gap-4 md:grid-cols-3">
              <PrizeCard
                title="5-match"
                amount={formatMoney(
                  simulation.fiveMatchPoolPaise
                )}
                share="40%"
              />

              <PrizeCard
                title="4-match"
                amount={formatMoney(
                  simulation.fourMatchPoolPaise
                )}
                share="35%"
              />

              <PrizeCard
                title="3-match"
                amount={formatMoney(
                  simulation.threeMatchPoolPaise
                )}
                share="25%"
              />
            </section>

            {/* JACKPOT */}
            {simulation.jackpotRolloverPaise >
              0 && (
              <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
                <p className="text-sm font-medium text-amber-300">
                  Jackpot rollover
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {formatMoney(
                    simulation.jackpotRolloverPaise
                  )}{" "}
                  has been added to the 5-match pool.
                </p>
              </div>
            )}

            {/* WINNERS */}
            <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.025] p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-600">
                Winner preview
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Potential winners
              </h2>

              {simulation.winners.length ===
              0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-8 text-center">
                  <Trophy
                    size={28}
                    className="mx-auto text-slate-700"
                  />

                  <p className="mt-3 font-medium">
                    No 3+ match winners
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    The 5-match pool would roll over to the next draw.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {simulation.winners.map(
                    (winner) => (
                      <div
                        key={winner.userId}
                        className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium">
                            User{" "}
                            {winner.userId.slice(
                              0,
                              8
                            )}
                          </p>

                          <p className="mt-1 text-sm text-slate-600">
                            {
                              winner.matchCount
                            }
                            -match ·{" "}
                            {winner.matchedNumbers.join(
                              ", "
                            )}
                          </p>
                        </div>

                        <p className="font-semibold text-emerald-400">
                          {formatMoney(
                            winner.prizeAmountPaise
                          )}
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>

            {/* PUBLISH */}
            <section className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
                  <Send size={20} />
                </div>

                <div>
                  <h2 className="font-semibold">
                    Publish this draw
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Publishing permanently records this monthly draw
                    and creates the associated winner records.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={publishDraw}
                disabled={publishing}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {publishing ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />

                    Publishing draw...
                  </>
                ) : (
                  <>
                    <Send size={17} />

                    Publish monthly draw
                  </>
                )}
              </button>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Dice5;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
      <Icon
        size={18}
        className="text-slate-600"
      />

      <p className="mt-5 text-xs text-slate-600">
        {label}
      </p>

      <p className="mt-2 truncate text-lg font-semibold">
        {value}
      </p>
    </div>
  );
}

function PrizeCard({
  title,
  amount,
  share,
}: {
  title: string;
  amount: string;
  share: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
      <div className="flex items-center justify-between">
        <p className="font-medium">
          {title}
        </p>

        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-500">
          {share}
        </span>
      </div>

      <p className="mt-5 text-2xl font-semibold text-emerald-400">
        {amount}
      </p>
    </div>
  );
}