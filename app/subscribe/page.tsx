"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Heart,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Plan = "monthly" | "yearly";

const plans = {
  monthly: {
    name: "Monthly",
    amount: 499,
    period: "month",
    description: "Flexible membership with monthly billing.",
  },
  yearly: {
    name: "Yearly",
    amount: 4999,
    period: "year",
    description: "One annual membership with a lower effective cost.",
  },
};

export default function SubscribePage() {
  const router = useRouter();

  const [selectedPlan, setSelectedPlan] = useState<Plan>("monthly");
  const [charityPercent, setCharityPercent] = useState(10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const plan = plans[selectedPlan];

  async function handleSubscribe() {
  setLoading(true);
  setError("");

  try {
    const response = await fetch("/api/subscriptions/activate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan: selectedPlan,
        charityPercent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        router.push("/login");
        return;
      }

      throw new Error(
        data.error || "Unable to activate your membership."
      );
    }

    router.push("/dashboard");
    router.refresh();
  } catch (err) {
    console.error("Subscription activation failed:", err);

    setError(
      err instanceof Error
        ? err.message
        : "Unable to activate your membership."
    );
  } finally {
    setLoading(false);
  }
}

  return (
    <main className="min-h-screen bg-[#07110d] text-white">
      <header className="border-b border-white/5">
        <div className="mx-auto flex max-w-6xl items-center px-6 py-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
            <Sparkles size={16} />
            Membership
          </div>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Choose your membership.
          </h1>

          <p className="mt-4 text-lg leading-8 text-slate-500">
            Join Digital Heroes, keep your scores active for monthly draws
            and support a cause you care about.
          </p>
        </div>

        {/* TEST MODE NOTICE */}
        <div className="mt-8 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
          <div className="flex gap-3">
            <CreditCard className="mt-0.5 shrink-0 text-amber-400" size={19} />

            <div>
              <p className="font-medium text-amber-200">
                Demo / Test Mode
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Payment processing is currently simulated for the selection
                assignment. No real payment is taken. The subscription
                architecture is ready for a PCI-compliant provider such as
                Stripe Checkout.
              </p>
            </div>
          </div>
        </div>

        {/* PLANS */}
        <section className="mt-8 grid gap-5 md:grid-cols-2">
          {(Object.keys(plans) as Plan[]).map((key) => {
            const current = plans[key];
            const selected = selectedPlan === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedPlan(key)}
                className={`relative text-left rounded-3xl border p-7 transition ${
                  selected
                    ? "border-emerald-400/40 bg-emerald-400/5"
                    : "border-white/10 bg-white/[0.025] hover:border-white/20"
                }`}
              >
                {key === "yearly" && (
                  <span className="absolute right-6 top-6 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-400">
                    Annual
                  </span>
                )}

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    selected
                      ? "bg-emerald-400 text-slate-950"
                      : "bg-white/5 text-slate-400"
                  }`}
                >
                  <Trophy size={19} />
                </div>

                <p className="mt-6 text-sm font-medium text-slate-500">
                  {current.name}
                </p>

                <div className="mt-2 flex items-end gap-2">
                  <span className="text-4xl font-semibold">
                    ₹{current.amount.toLocaleString("en-IN")}
                  </span>

                  <span className="mb-1 text-sm text-slate-600">
                    /{current.period}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {current.description}
                </p>

                <div className="mt-6 space-y-3">
                  <PlanFeature text="Eligible for monthly draws" />
                  <PlanFeature text="Track your latest five scores" />
                  <PlanFeature text="Choose your charity contribution" />
                </div>

                <div className="absolute right-6 bottom-7">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                      selected
                        ? "border-emerald-400 bg-emerald-400 text-slate-950"
                        : "border-white/20"
                    }`}
                  >
                    {selected && <Check size={14} />}
                  </div>
                </div>
              </button>
            );
          })}
        </section>

        {/* CHARITY CONTRIBUTION */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.025] p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
              <Heart size={20} />
            </div>

            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500">
                Charity contribution
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                Decide how much you want to give back.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                The minimum contribution is 10%. You can increase your
                contribution percentage.
              </p>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">
                    Contribution
                  </span>

                  <span className="text-lg font-semibold text-emerald-400">
                    {charityPercent}%
                  </span>
                </div>

                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={charityPercent}
                  onChange={(e) =>
                    setCharityPercent(Number(e.target.value))
                  }
                  className="mt-4 w-full accent-emerald-400"
                />

                <div className="mt-2 flex justify-between text-xs text-slate-700">
                  <span>10%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SUMMARY */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.025] p-7">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-600">
                Membership summary
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-white/5 px-3 py-1.5 text-sm capitalize text-slate-300">
                  {selectedPlan}
                </span>

                <span className="text-sm text-slate-500">
                  ₹{plan.amount.toLocaleString("en-IN")} /{" "}
                  {plan.period}
                </span>

                <span className="text-sm text-emerald-400">
                  {charityPercent}% charity
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubscribe}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-7 py-4 font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShieldCheck size={18} />
              {loading ? "Activating..." : "Activate test membership"}
            </button>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function PlanFeature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-400">
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400">
        <Check size={12} />
      </div>

      {text}
    </div>
  );
}