"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "shifthabits_timer_session";

type Event = {
  id: string;
  title: string;
  lengthSeconds: number;
  energy: number;
  category: string;
  baseXp: number;
  baseCoins: number;
};

type TimerState = "not_started" | "running" | "paused" | "completed";

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map((n) => n.toString().padStart(2, "0")).join(":");
}

// Simplified reward calculation (mirror iOS RewardCalculationService for now)
function xpForCompletion(baseXp: number, lengthSeconds: number, completion: number) {
  const lengthFactor = Math.floor(lengthSeconds / 60 / 15);
  return Math.min(100, Math.max(0, Math.floor((baseXp + lengthFactor * 5) * completion)));
}
function coinsForCompletion(baseCoins: number, lengthSeconds: number, completion: number) {
  const lengthFactor = Math.floor(lengthSeconds / 60 / 30);
  return Math.min(30, Math.max(0, Math.floor((baseCoins + lengthFactor * 2) * completion)));
}

export function CompletingTaskView({ event }: { event: Event }) {
  const router = useRouter();
  const [taskState, setTaskState] = useState<TimerState>("not_started");
  const [timeRemaining, setTimeRemaining] = useState(event.lengthSeconds);
  const [startDate, setStartDate] = useState<number | null>(null);
  const [endDate, setEndDate] = useState<number | null>(null);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [totalPausedMs, setTotalPausedMs] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [earnedXp, setEarnedXp] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [completionPct, setCompletionPct] = useState(0);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const completionPercentage = event.lengthSeconds > 0
    ? 1 - timeRemaining / event.lengthSeconds
    : 1;
  const previewXp = xpForCompletion(event.baseXp, event.lengthSeconds, completionPercentage);
  const previewCoins = coinsForCompletion(event.baseCoins, event.lengthSeconds, completionPercentage);

  const persistSession = useCallback(() => {
    if (startDate && endDate && typeof window !== "undefined") {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          eventId: event.id,
          startDate,
          endDate,
          taskState,
          pausedAt,
          totalPausedMs,
        })
      );
    }
  }, [event.id, startDate, endDate, taskState, pausedAt, totalPausedMs]);

  const clearSession = useCallback(() => {
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    if (taskState !== "running" && taskState !== "paused") return;
    const interval = setInterval(() => {
      if (!endDate) return;
      const now = Date.now();
      if (pausedAt) {
        setTimeRemaining(Math.max(0, (endDate - pausedAt + totalPausedMs) / 1000));
        return;
      }
      const remaining = (endDate - now + totalPausedMs) / 1000;
      setTimeRemaining(Math.max(0, remaining));
      if (remaining <= 0) {
        setTaskState("completed");
        setTimeRemaining(0);
        clearInterval(interval);
        handleComplete(1.0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [taskState, endDate, pausedAt, totalPausedMs]);

  useEffect(() => {
    if (taskState === "running" || taskState === "paused") persistSession();
  }, [taskState, persistSession]);

  const handleStart = () => {
    const now = Date.now();
    setStartDate(now);
    setEndDate(now + event.lengthSeconds * 1000);
    setPausedAt(null);
    setTotalPausedMs(0);
    setTaskState("running");
  };

  const handlePause = () => {
    setPausedAt(Date.now());
    setTaskState("paused");
  };

  const handleResume = () => {
    if (pausedAt) {
      setTotalPausedMs((prev) => prev + (Date.now() - pausedAt));
      setPausedAt(null);
    }
    setTaskState("running");
  };

  async function handleComplete(percentage: number) {
    setCompletionPct(percentage);
    setCompleteError(null);
    setIsCompleting(true);

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setCompleteError("Not signed in.");
      setIsCompleting(false);
      return;
    }

    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/complete-event`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        eventId: event.id,
        completionPercentage: percentage,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setCompleteError(data?.error ?? `Request failed (${res.status})`);
      setIsCompleting(false);
      return;
    }

    setEarnedXp(data.rewards?.xp ?? 0);
    setEarnedCoins(data.rewards?.coins ?? 0);
    clearSession();
    setShowCompletionModal(true);
    setIsCompleting(false);
  }

  const handleEndEarly = () => {
    const pct = Math.max(0, 1 - timeRemaining / event.lengthSeconds);
    setTaskState("completed");
    setTimeRemaining(0);
    handleComplete(pct);
  };

  const handleReturnHome = () => {
    clearSession();
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 p-4">
      <div className="mx-auto max-w-lg">
        <header className="mb-4 rounded-xl bg-white/90 p-4 shadow">
          <h1 className="text-lg font-semibold text-gray-900">{event.title}</h1>
        </header>

        <div className="mb-4 rounded-xl bg-white/90 p-6 shadow">
          <div className="mb-4 text-center">
            <p className="text-4xl font-mono font-bold text-gray-900 tabular-nums">
              {formatTime(Math.max(0, Math.floor(timeRemaining)))}
            </p>
          </div>
          <div className="mb-4 flex justify-center gap-4 text-sm text-gray-600">
            <span>Category: {event.category}</span>
            <span>Energy: {"⚡".repeat(event.energy)}</span>
          </div>
          <div className="flex justify-center gap-6 text-sm">
            <span>XP: {taskState === "completed" ? earnedXp : previewXp}</span>
            <span>Coins: {taskState === "completed" ? earnedCoins : previewCoins}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {taskState === "not_started" && (
            <button
              type="button"
              onClick={handleStart}
              className="w-full rounded-xl bg-green-600 py-3 font-medium text-white hover:bg-green-700"
            >
              Start Task
            </button>
          )}
          {taskState === "running" && (
            <>
              <button
                type="button"
                onClick={handlePause}
                disabled={isCompleting}
                className="w-full rounded-xl bg-amber-500 py-3 font-medium text-white hover:bg-amber-600 disabled:opacity-50"
              >
                Pause
              </button>
              <button
                type="button"
                onClick={handleEndEarly}
                disabled={isCompleting}
                className="w-full rounded-xl border border-gray-300 bg-white py-3 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                End Task Early
              </button>
            </>
          )}
          {taskState === "paused" && (
            <>
              <button
                type="button"
                onClick={handleResume}
                disabled={isCompleting}
                className="w-full rounded-xl bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Resume
              </button>
              <button
                type="button"
                onClick={handleEndEarly}
                disabled={isCompleting}
                className="w-full rounded-xl border border-gray-300 bg-white py-3 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                End Task Early
              </button>
            </>
          )}
          {(taskState === "not_started" || taskState === "paused") && (
            <Link
              href="/dashboard"
              onClick={clearSession}
              className="block w-full rounded-xl border border-gray-300 bg-white py-3 text-center font-medium text-gray-700 hover:bg-gray-50"
            >
              Return to Dashboard
            </Link>
          )}
          {completeError && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
              {completeError}
            </p>
          )}
          {isCompleting && (
            <p className="text-center text-sm text-gray-500">Completing task…</p>
          )}
        </div>
      </div>

      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900">Task completed!</h2>
            <p className="mt-2 text-gray-600">
              You earned {earnedXp} XP and {earnedCoins} coins
              {completionPct < 1 && ` (${Math.round(completionPct * 100)}% completion)`}.
            </p>
            <button
              type="button"
              onClick={handleReturnHome}
              className="mt-4 w-full rounded-lg bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
