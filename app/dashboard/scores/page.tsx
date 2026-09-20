"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Score = {
  id: string;
  score_date: string;
  stableford_score: number;
  created_at: string;
};

export default function ScoresPage() {
  const supabase = createClient();

  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [scoreDate, setScoreDate] = useState("");
  const [stablefordScore, setStablefordScore] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadScores() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("scores")
      .select("*")
      .eq("user_id", user.id)
      .order("score_date", { ascending: false })
      .limit(5);

    if (error) {
      setError(error.message);
    } else {
      setScores(data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadScores();
  }, []);

  function resetForm() {
    setScoreDate("");
    setStablefordScore("");
    setEditingId(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");

    const parsedScore = Number(stablefordScore);

    // Stableford validation
    if (
      !Number.isInteger(parsedScore) ||
      parsedScore < 1 ||
      parsedScore > 45
    ) {
      setError("Stableford score must be a whole number between 1 and 45.");
      return;
    }

    if (!scoreDate) {
      setError("Please select the score date.");
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

    // ---------------------------------------------------------
    // EDIT EXISTING SCORE
    // ---------------------------------------------------------

    if (editingId) {
      // Check whether another score already uses this date.
      const { data: duplicate } = await supabase
        .from("scores")
        .select("id")
        .eq("user_id", user.id)
        .eq("score_date", scoreDate)
        .neq("id", editingId)
        .maybeSingle();

      if (duplicate) {
        setError("You already have a score recorded for this date.");
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from("scores")
        .update({
          score_date: scoreDate,
          stableford_score: parsedScore,
        })
        .eq("id", editingId)
        .eq("user_id", user.id);

      if (error) {
        setError(error.message);
      } else {
        setMessage("Score updated successfully.");
        resetForm();
        await loadScores();
      }

      setSaving(false);
      return;
    }

    // ---------------------------------------------------------
    // NEW SCORE
    // ---------------------------------------------------------

    // Check duplicate date BEFORE deleting anything.
    const { data: duplicate } = await supabase
      .from("scores")
      .select("id")
      .eq("user_id", user.id)
      .eq("score_date", scoreDate)
      .maybeSingle();

    if (duplicate) {
      setError("You already have a score recorded for this date.");
      setSaving(false);
      return;
    }

    // Get current scores oldest first.
    const { data: currentScores } = await supabase
      .from("scores")
      .select("id, score_date")
      .eq("user_id", user.id)
      .order("score_date", { ascending: true });

    // If already at the five-score limit,
    // remove the oldest score before adding the new one.
    if (currentScores && currentScores.length >= 5) {
      const oldestScore = currentScores[0];

      const { error: deleteError } = await supabase
        .from("scores")
        .delete()
        .eq("id", oldestScore.id)
        .eq("user_id", user.id);

      if (deleteError) {
        setError("Unable to rotate your oldest score.");
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase.from("scores").insert({
      user_id: user.id,
      score_date: scoreDate,
      stableford_score: parsedScore,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage(
        currentScores && currentScores.length >= 5
          ? "Score added. Your oldest score was automatically replaced."
          : "Score added successfully."
      );

      resetForm();
      await loadScores();
    }

    setSaving(false);
  }

  function startEditing(score: Score) {
    setEditingId(score.id);
    setScoreDate(score.score_date);
    setStablefordScore(String(score.stableford_score));
    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteScore(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this score?"
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    const { error } = await supabase
      .from("scores")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Score deleted successfully.");
    await loadScores();
  }

  return (
    <main className="min-h-screen bg-[#07110d] text-white">
      {/* HEADER */}
      <header className="border-b border-white/5 bg-[#07110d]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center px-6 py-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* TITLE */}
        <div>
          <p className="text-sm font-medium text-emerald-400">
            Performance
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Your scores
          </h1>

          <p className="mt-3 max-w-2xl text-slate-500">
            Keep your five most recent Stableford scores ready for the
            monthly Hero Draw.
          </p>
        </div>

        {/* RULE CARD */}
        <div className="mt-6 rounded-2xl border border-emerald-400/10 bg-emerald-400/5 p-5">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
              <BarChart3 size={19} />
            </div>

            <div>
              <p className="font-medium text-emerald-200">
                Five-score rolling window
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                You can keep up to five scores. Adding a sixth score
                automatically removes the oldest one.
              </p>
            </div>
          </div>
        </div>

        {/* FORM */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.025] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-600">
                {editingId ? "Edit score" : "Add score"}
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                {editingId
                  ? "Update your round"
                  : "Record a Stableford round"}
              </h2>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                <X size={16} />
                Cancel
              </button>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-6 grid gap-5 sm:grid-cols-[1fr_1fr_auto]"
          >
            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Score date
              </label>

              <div className="relative">
                <CalendarDays
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
                />

                <input
                  type="date"
                  required
                  value={scoreDate}
                  onChange={(e) => setScoreDate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pl-11 text-white outline-none transition focus:border-emerald-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Stableford score
              </label>

              <input
                type="number"
                min="1"
                max="45"
                step="1"
                required
                value={stablefordScore}
                onChange={(e) => setStablefordScore(e.target.value)}
                placeholder="e.g. 36"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {editingId ? (
                  <>
                    <Pencil size={16} />
                    {saving ? "Saving..." : "Update"}
                  </>
                ) : (
                  <>
                    <Plus size={17} />
                    {saving ? "Adding..." : "Add score"}
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
              <CheckCircle2 size={17} />
              {message}
            </div>
          )}
        </section>

        {/* SCORE LIST */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.025] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-600">
                Score history
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Latest {scores.length} of 5
              </h2>
            </div>

            <div className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-500">
              {scores.length}/5
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-slate-600">
              Loading scores...
            </div>
          ) : scores.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-10 text-center">
              <BarChart3
                size={32}
                className="mx-auto text-slate-700"
              />

              <p className="mt-4 font-medium">
                No scores recorded
              </p>

              <p className="mt-1 text-sm text-slate-600">
                Add your first Stableford score above.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {scores.map((score, index) => (
                <div
                  key={score.id}
                  className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 font-semibold text-emerald-400">
                      {score.stableford_score}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {score.stableford_score} Stableford points
                        </p>

                        {index === 0 && (
                          <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                            Latest
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-slate-600">
                        {new Date(
                          `${score.score_date}T00:00:00`
                        ).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(score)}
                      className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteScore(score.id)}
                      className="flex items-center gap-2 rounded-xl border border-red-400/10 px-3 py-2 text-sm text-red-400 transition hover:bg-red-400/10"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}