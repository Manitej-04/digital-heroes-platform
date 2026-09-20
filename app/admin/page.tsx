"use client";

import Link from "next/link";
import {
  BarChart3,
  Building2,
  ChevronRight,
  CircleDollarSign,
  Dice5,
  Heart,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#07110d] text-white">
      {/* HEADER */}
      <header className="border-b border-white/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-medium text-emerald-400">
              Digital Heroes
            </p>

            <h1 className="mt-1 text-2xl font-semibold">
              Admin Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-400">
            <ShieldCheck
              size={16}
              className="text-emerald-400"
            />
            Administrator
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* INTRO */}
        <section>
          <p className="text-sm font-medium text-emerald-400">
            Control centre
          </p>

          <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">
            Manage Digital Heroes
          </h2>

          <p className="mt-3 max-w-2xl text-slate-500">
            Manage subscribers, monthly draws, charities,
            winners and platform activity.
          </p>
        </section>

        {/* STATS */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Users"
            value="Subscriber management"
          />

          <StatCard
            icon={Dice5}
            label="Monthly Draw"
            value="Configure & publish"
          />

          <StatCard
            icon={Heart}
            label="Charities"
            value="Manage causes"
          />

          <StatCard
            icon={Trophy}
            label="Winners"
            value="Verify & payout"
          />
        </section>

        {/* DRAW MANAGEMENT */}
        <section className="mt-8 rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-7">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
                <Dice5 size={22} />
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-600">
                  Draw management
                </p>

                <h3 className="mt-2 text-xl font-semibold">
                  Monthly Hero Draw
                </h3>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Configure random or score-weighted draws,
                  simulate prize distribution and publish the
                  monthly result.
                </p>
              </div>
            </div>

            <Link
              href="/admin/draws"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Open draw management
              <ChevronRight size={17} />
            </Link>
          </div>
        </section>

        {/* MANAGEMENT GRID */}
        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <ManagementCard
            href="/admin/users"
            icon={Users}
            title="User management"
            description="Review subscribers and membership status."
          />

          <ManagementCard
            href="/dashboard/charity"
            icon={Heart}
            title="Charity impact"
            description="Review the subscriber charity contribution experience."
          />

          <ManagementCard
            href="/admin/winners"
            icon={Trophy}
            title="Winner verification"
            description="Review winner evidence and payment status."
          />

          <ManagementCard
            href="/admin/users"
            icon={BarChart3}
            title="Platform overview"
            description="Review subscribers, plans and membership activity."
          />
        </section>

        {/* PLATFORM INFO */}
        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <InfoCard
            icon={CircleDollarSign}
            title="Prize allocation"
            text="40% to 5-match, 35% to 4-match and 25% to 3-match."
          />

          <InfoCard
            icon={Heart}
            title="Charity-first"
            text="Subscribers can select a cause and configure their contribution."
          />

          <InfoCard
            icon={Building2}
            title="Platform"
            text="Digital Heroes subscription and monthly draw platform."
          />
        </section>
      </div>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
      <Icon
        size={19}
        className="text-slate-600"
      />

      <p className="mt-5 text-sm text-slate-600">
        {label}
      </p>

      <p className="mt-2 font-semibold">
        {value}
      </p>
    </div>
  );
}

function ManagementCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof Users;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-white/10 bg-white/[0.025] p-6 transition hover:border-emerald-400/20 hover:bg-emerald-400/[0.03]"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
          <Icon size={19} />
        </div>

        <ChevronRight
          size={18}
          className="text-slate-700 transition group-hover:text-emerald-400"
        />
      </div>

      <h3 className="mt-5 font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {description}
      </p>
    </Link>
  );
}

function InfoCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Heart;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
      <Icon
        size={19}
        className="text-emerald-400"
      />

      <h3 className="mt-5 font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {text}
      </p>
    </div>
  );
}