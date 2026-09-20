"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Heart,
  Search,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Charity = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  website_url: string | null;
  featured: boolean;
  active: boolean;
};

export default function CharityPage() {
  const supabase = createClient();

  const [charities, setCharities] = useState<Charity[]>([]);
  const [selectedCharityId, setSelectedCharityId] = useState<string | null>(
    null
  );

  const [contributionPercent, setContributionPercent] = useState(10);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: charityData, error: charityError } = await supabase
      .from("charities")
      .select(
        "id, name, slug, description, image_url, website_url, featured, active"
      )
      .eq("active", true)
      .order("featured", { ascending: false })
      .order("name", { ascending: true });

    if (charityError) {
      setError(charityError.message);
      setLoading(false);
      return;
    }

    const { data: userCharity, error: userCharityError } = await supabase
      .from("user_charities")
      .select("charity_id, contribution_percent")
      .eq("user_id", user.id)
      .maybeSingle();

    if (userCharityError) {
      setError(userCharityError.message);
      setLoading(false);
      return;
    }

    setCharities(charityData ?? []);

    if (userCharity) {
      setSelectedCharityId(userCharity.charity_id);
      setContributionPercent(userCharity.contribution_percent);
    }

    setLoading(false);
  }

  const filteredCharities = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return charities;
    }

    return charities.filter((charity) => {
      return (
        charity.name.toLowerCase().includes(query)
      );
    });
  }, [charities, search]);

  async function saveCharity() {
    setError("");
    setMessage("");

    if (!selectedCharityId) {
      setError("Please select a charity first.");
      return;
    }

    if (contributionPercent < 10 || contributionPercent > 100) {
      setError("Charity contribution must be between 10% and 100%.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { error: upsertError } = await supabase
      .from("user_charities")
      .upsert(
        {
          user_id: user.id,
          charity_id: selectedCharityId,
          contribution_percent: contributionPercent,
          is_active: true,
        },
        {
          onConflict: "user_id",
        }
      );

    if (upsertError) {
      setError(upsertError.message);
      setSaving(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        charity_percent: contributionPercent,
      })
      .eq("id", user.id);

    if (profileError) {
      setError(profileError.message);
      setSaving(false);
      return;
    }

    setMessage("Your charity selection has been saved.");
    setSaving(false);
  }

  const selectedCharity = charities.find(
    (charity) => charity.id === selectedCharityId
  );

  return (
    <main className="min-h-screen bg-[#07110d] text-white">
      {/* HEADER */}
      <header className="border-b border-white/5 bg-[#07110d]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Dashboard
          </Link>

          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <Heart size={16} />
            Your impact
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[2rem] border border-emerald-400/10 bg-gradient-to-br from-emerald-400/10 via-white/[0.025] to-transparent p-8 sm:p-10">
          <div className="absolute right-[-80px] top-[-100px] h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative max-w-3xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
              <Heart size={20} />
            </div>

            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Choose your cause
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Your game can create impact.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-500">
              Select a charity from our directory and decide how much of your
              contribution you want to dedicate to making a difference.
            </p>
          </div>
        </section>

        {/* CONTRIBUTION */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-7">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-600">
                Contribution
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                How much would you like to give?
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                The minimum contribution is 10%. You can increase this
                percentage at any time.
              </p>
            </div>

            <div className="min-w-64 md:w-80">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Your contribution
                </span>

                <span className="text-2xl font-semibold text-emerald-400">
                  {contributionPercent}%
                </span>
              </div>

              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={contributionPercent}
                onChange={(event) =>
                  setContributionPercent(Number(event.target.value))
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
        </section>

        {/* SEARCH */}
        <section className="mt-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-600">
                Charity directory
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Find a cause
              </h2>
            </div>

            <div className="relative sm:w-80">
              <Search
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search charities..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pl-11 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-emerald-400"
              />
            </div>
          </div>
        </section>

        {/* CHARITIES */}
        <section className="mt-6">
          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-12 text-center text-sm text-slate-600">
              Loading charities...
            </div>
          ) : filteredCharities.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center">
              <Heart size={30} className="mx-auto text-slate-700" />

              <p className="mt-4 font-medium">
                No charities found
              </p>

              <p className="mt-1 text-sm text-slate-600">
                Try a different search.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredCharities.map((charity) => {
                const selected = selectedCharityId === charity.id;

                return (
                  <button
                    key={charity.id}
                    type="button"
                    onClick={() => setSelectedCharityId(charity.id)}
                    className={`group relative overflow-hidden rounded-3xl border text-left transition duration-300 hover:-translate-y-1 ${
                      selected
                        ? "border-emerald-400/40 bg-emerald-400/5"
                        : "border-white/10 bg-white/[0.025] hover:border-white/20"
                    }`}
                  >
                    {/* IMAGE / PLACEHOLDER */}
                    <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-400/10 to-white/[0.02]">
                      {charity.image_url ? (
                        <img
                          src={charity.image_url}
                          alt={charity.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <Heart
                          size={42}
                          strokeWidth={1.5}
                          className="text-emerald-400/40"
                        />
                      )}

                      {charity.featured && (
                        <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                          <Sparkles size={12} className="text-emerald-400" />
                          Featured
                        </div>
                      )}

                      {selected && (
                        <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400 text-slate-950 shadow-lg">
                          <Check size={17} />
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <h3 className="text-lg font-semibold">
                        {charity.name}
                      </h3>

                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                        {charity.description ||
                          "Supporting meaningful community impact."}
                      </p>

                      <div
                        className={`mt-5 flex items-center justify-between text-sm ${
                          selected
                            ? "text-emerald-400"
                            : "text-slate-500"
                        }`}
                      >
                        <span>
                          {selected ? "Selected" : "Select this charity"}
                        </span>

                        <Heart size={16} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* SELECTED CHARITY */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-7">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-600">
                Selected charity
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                {selectedCharity
                  ? selectedCharity.name
                  : "No charity selected"}
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                {selectedCharity
                  ? `${contributionPercent}% contribution`
                  : "Select a charity above to continue."}
              </p>
            </div>

            <button
              type="button"
              onClick={saveCharity}
              disabled={!selectedCharityId || saving}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check size={17} />
              {saving ? "Saving..." : "Save selection"}
            </button>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
              {message}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}