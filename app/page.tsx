import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Heart,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Join the community",
    description:
      "Choose a monthly or yearly membership and become part of a community built around performance and impact.",
    icon: Users,
  },
  {
    number: "02",
    title: "Track your scores",
    description:
      "Add your latest Stableford scores and keep your five most recent rounds ready for the monthly draw.",
    icon: BarChart3,
  },
  {
    number: "03",
    title: "Play for impact",
    description:
      "Every membership helps support your chosen charity while giving you a chance to win in the monthly draw.",
    icon: Heart,
  },
];

const stats = [
  {
    value: "5",
    label: "Recent scores",
  },
  {
    value: "3",
    label: "Prize tiers",
  },
  {
    value: "10%",
    label: "Minimum charity contribution",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#07110d] text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-0">
        <div className="absolute left-[10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[140px]" />
        <div className="absolute right-[-10%] top-[20%] h-[600px] w-[600px] rounded-full bg-cyan-400/5 blur-[160px]" />
      </div>

      {/* NAVBAR */}
      <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20">
            <Sparkles size={20} strokeWidth={2.5} />
          </div>

          <div>
            <p className="text-sm font-bold tracking-[0.2em] text-white">
              DIGITAL
            </p>
            <p className="-mt-1 text-sm font-bold tracking-[0.2em] text-emerald-400">
              HEROES
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
          <a
            href="#how-it-works"
            className="transition hover:text-white"
          >
            How it works
          </a>

          <a
            href="#impact"
            className="transition hover:text-white"
          >
            Our impact
          </a>

          <a
            href="#membership"
            className="transition hover:text-white"
          >
            Membership
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-xl px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white sm:block"
          >
            Sign in
          </Link>

          <Link
            href="/signup"
            className="group flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
          >
            Join now
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-16 lg:px-8 lg:pb-32 lg:pt-24">
        <div className="grid items-center gap-16 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-4 py-2 text-sm text-emerald-300">
              <Sparkles size={15} />
              Performance with purpose
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Your game.
              <br />
              <span className="text-emerald-400">Your impact.</span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">
              Digital Heroes brings performance, community and charitable
              giving together. Track your game, enter the monthly draw and
              help create meaningful change.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="group flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-6 py-4 font-bold text-slate-950 shadow-xl shadow-emerald-500/10 transition hover:-translate-y-0.5 hover:bg-emerald-300"
              >
                Become a Digital Hero
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <a
                href="#how-it-works"
                className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 font-medium text-white transition hover:bg-white/[0.06]"
              >
                See how it works
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                Secure membership
              </div>

              <div className="flex items-center gap-2">
                <Heart size={16} className="text-emerald-400" />
                Charity-first
              </div>

              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-emerald-400" />
                Monthly draws
              </div>
            </div>
          </div>

          {/* HERO CARD */}
          <div className="relative">
            <div className="absolute -inset-8 rounded-[3rem] bg-emerald-400/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl backdrop-blur-xl">
              <div className="rounded-[1.5rem] border border-white/10 bg-[#0b1813] p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                      This month
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold">
                      Hero Draw
                    </h2>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
                    <Trophy size={20} />
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-5 gap-2">
                  {[32, 18, 41, 27, 35].map((number) => (
                    <div
                      key={number}
                      className="flex aspect-square items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-lg font-semibold text-emerald-300"
                    >
                      {number}
                    </div>
                  ))}
                </div>

                <div className="mt-8 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-white/[0.04] p-4">
                    <p className="text-xs text-slate-500">5 match</p>
                    <p className="mt-1 font-semibold">Jackpot</p>
                  </div>

                  <div className="rounded-2xl bg-white/[0.04] p-4">
                    <p className="text-xs text-slate-500">4 match</p>
                    <p className="mt-1 font-semibold">35%</p>
                  </div>

                  <div className="rounded-2xl bg-white/[0.04] p-4">
                    <p className="text-xs text-slate-500">3 match</p>
                    <p className="mt-1 font-semibold">25%</p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-emerald-400/10 bg-emerald-400/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">
                      Charity contribution
                    </span>

                    <span className="font-semibold text-emerald-300">
                      From 10%
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between px-2 pb-1">
                <div>
                  <p className="text-xs text-slate-500">
                    Built around your latest
                  </p>
                  <p className="text-sm font-medium text-slate-300">
                    five Stableford scores
                  </p>
                </div>

                <BarChart3 size={20} className="text-slate-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="relative z-10 border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-white/5 px-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:px-8">
          {stats.map((stat) => (
            <div key={stat.label} className="px-6 py-8 text-center">
              <p className="text-3xl font-semibold text-emerald-400">
                {stat.value}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="relative z-10 mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32"
      >
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
            How it works
          </p>

          <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Simple to join.
            <br />
            Meaningful to be part of.
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-400">
            Everything you need is designed around a simple monthly
            experience: membership, performance, draw and impact.
          </p>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <div
                key={step.number}
                className="group rounded-3xl border border-white/10 bg-white/[0.025] p-7 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/20 hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-emerald-400">
                    {step.number}
                  </span>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-slate-300 transition group-hover:bg-emerald-400/10 group-hover:text-emerald-400">
                    <Icon size={20} />
                  </div>
                </div>

                <h3 className="mt-10 text-xl font-semibold">
                  {step.title}
                </h3>

                <p className="mt-3 leading-7 text-slate-500">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* IMPACT */}
      <section
        id="impact"
        className="relative z-10 mx-auto max-w-7xl px-6 pb-24 lg:px-8 lg:pb-32"
      >
        <div className="overflow-hidden rounded-[2rem] border border-emerald-400/10 bg-gradient-to-br from-emerald-400/10 via-white/[0.03] to-transparent p-8 sm:p-12 lg:p-16">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.7fr]">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400">
                <Heart size={23} />
              </div>

              <p className="mt-7 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
                Impact matters
              </p>

              <h2 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Every membership can give something back.
              </h2>

              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-400">
                Choose a charity during your membership journey and decide
                how much of your contribution you want to dedicate to
                making an impact.
              </p>

              <Link
                href="/signup"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Choose your cause
                <ArrowRight size={17} />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl border border-white/10 bg-black/10 p-6">
                <p className="text-4xl font-semibold text-white">10%</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Minimum contribution
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/10 p-6">
                <p className="text-4xl font-semibold text-white">100%</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  You can increase your contribution
                </p>
              </div>

              <div className="col-span-2 rounded-3xl border border-white/10 bg-black/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">
                      Your chosen cause
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Select from the charity directory
                    </p>
                  </div>

                  <Heart className="text-emerald-400" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MEMBERSHIP CTA */}
      <section
        id="membership"
        className="relative z-10 mx-auto max-w-4xl px-6 pb-28 text-center lg:pb-36"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Ready?
        </p>

        <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          Become part of something bigger.
        </h2>

        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-400">
          Start your membership, track your game and choose the cause you
          want to support.
        </p>

        <Link
          href="/signup"
          className="mt-9 inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-7 py-4 font-bold text-slate-950 shadow-xl shadow-emerald-500/10 transition hover:-translate-y-0.5 hover:bg-emerald-300"
        >
          Start your journey
          <ArrowRight size={18} />
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} Digital Heroes.</p>

          <div className="flex gap-5">
            <Link
              href="/login"
              className="transition hover:text-slate-300"
            >
              Sign in
            </Link>

            <Link
              href="/signup"
              className="transition hover:text-slate-300"
            >
              Join
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}