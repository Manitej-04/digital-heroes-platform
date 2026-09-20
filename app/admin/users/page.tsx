"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

type Subscription = {
  id: string;
  user_id: string;
  plan: "monthly" | "yearly";
  status: string;
  amount_paise: number;
  charity_percent: number;
  started_at: string;
  current_period_start: string;
  current_period_end: string;
  cancelled_at: string | null;
  provider: string;
  created_at: string;
};

type AdminUser = {
  id: string;
  name: string;
  role: string;
  charity_percent: number;
  created_at: string;
  subscription: Subscription | null;
};

type Stats = {
  totalUsers: number;
  activeSubscribers: number;
  monthlySubscribers: number;
  yearlySubscribers: number;
};

function formatRupees(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(paise || 0) / 100);
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getEffectiveStatus(subscription: Subscription | null) {
  if (!subscription) return "No subscription";

  if (
    subscription.status === "active" &&
    new Date(subscription.current_period_end) > new Date()
  ) {
    return "Active";
  }

  if (subscription.status === "cancelled") {
    return "Cancelled";
  }

  if (
    subscription.current_period_end &&
    new Date(subscription.current_period_end) <= new Date()
  ) {
    return "Lapsed";
  }

  return subscription.status;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeSubscribers: 0,
    monthlySubscribers: 0,
    yearlySubscribers: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/users", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load users."
        );
      }

      setUsers(data.users ?? []);
      setStats(
        data.stats ?? {
          totalUsers: 0,
          activeSubscribers: 0,
          monthlySubscribers: 0,
          yearlySubscribers: 0,
        }
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return users;

    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query) ||
        user.subscription?.plan
          ?.toLowerCase()
          .includes(query) ||
        getEffectiveStatus(user.subscription)
          .toLowerCase()
          .includes(query)
      );
    });
  }, [users, search]);

  return (
    <main className="min-h-screen bg-[#07110d] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-400"
            >
              <ArrowLeft size={15} />
              Back to admin
            </Link>

            <p className="text-sm font-medium uppercase tracking-wide text-emerald-400">
              Administration
            </p>

            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
              User Management
            </h1>

            <p className="mt-3 text-slate-500">
              Review users, subscriptions and membership
              status.
            </p>
          </div>

          <button
            type="button"
            onClick={loadUsers}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-emerald-400/30 hover:bg-emerald-400/10 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* STATS */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Total users"
            value={stats.totalUsers}
          />

          <StatCard
            icon={CheckCircle2}
            label="Active subscribers"
            value={stats.activeSubscribers}
          />

          <StatCard
            icon={Clock3}
            label="Monthly plans"
            value={stats.monthlySubscribers}
          />

          <StatCard
            icon={ShieldCheck}
            label="Yearly plans"
            value={stats.yearlySubscribers}
          />
        </section>

        {/* TABLE */}
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
          <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">
                Subscribers & Users
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                {filteredUsers.length} users shown
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search users..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-9 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-400/40"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-16 text-center">
              <RefreshCw
                size={28}
                className="mx-auto animate-spin text-emerald-400"
              />

              <p className="mt-4 text-sm text-slate-500">
                Loading users...
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-16 text-center">
              <Users
                size={32}
                className="mx-auto text-slate-700"
              />

              <p className="mt-4 text-sm text-slate-500">
                No users found.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-600">
                    <th className="px-5 py-4 font-semibold">
                      User
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Subscription
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Plan
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Amount
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Charity
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Period end
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => {
                    const subscription =
                      user.subscription;

                    const status =
                      getEffectiveStatus(subscription);

                    const active =
                      status === "Active";

                    return (
                      <tr
                        key={user.id}
                        className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                      >
                        <td className="px-5 py-5">
                          <div>
                            <p className="font-medium text-white">
                              {user.name}
                            </p>

                            <p className="mt-1 font-mono text-xs text-slate-600">
                              {user.id.slice(0, 8)}...
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-5 text-sm text-slate-400">
                          {subscription
                            ? subscription.provider
                            : "—"}
                        </td>

                        <td className="px-5 py-5">
                          {subscription ? (
                            <span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs font-semibold capitalize text-slate-300">
                              {subscription.plan}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td className="px-5 py-5 text-sm text-slate-300">
                          {subscription
                            ? formatRupees(
                                subscription.amount_paise
                              )
                            : "—"}
                        </td>

                        <td className="px-5 py-5 text-sm text-slate-300">
                          {subscription
                            ? `${subscription.charity_percent}%`
                            : `${user.charity_percent}%`}
                        </td>

                        <td className="px-5 py-5 text-sm text-slate-400">
                          {subscription
                            ? formatDate(
                                subscription.current_period_end
                              )
                            : "—"}
                        </td>

                        <td className="px-5 py-5">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              active
                                ? "bg-emerald-400/10 text-emerald-400"
                                : status === "Cancelled" ||
                                    status === "Lapsed"
                                  ? "bg-red-400/10 text-red-300"
                                  : "bg-slate-400/10 text-slate-400"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
  value: string | number;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
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