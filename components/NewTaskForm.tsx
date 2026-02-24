"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { baseXPForTask, baseCoinsForTask, TASK_CATEGORIES, TASK_FREQUENCIES } from "@/lib/task-utils";

const schema = z.object({
  title: z.string().min(1, "Title required"),
  description: z.string(),
  lengthMinutes: z.coerce.number().min(1).max(480),
  category: z.enum(TASK_CATEGORIES),
  frequency: z.enum(TASK_FREQUENCIES),
  energy: z.coerce.number().min(1).max(5),
  date: z.string().min(1, "Date required"),
});

type FormData = z.infer<typeof schema>;

const defaultNotificationTimings = [{ minutesBeforeEvent: -15, isEnabled: true }];

export function NewTaskForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      lengthMinutes: 30,
      category: "work",
      frequency: "once",
      energy: 1,
      date: new Date().toISOString().slice(0, 16),
    },
  });

  async function onSubmit(data: FormData) {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const lengthSeconds = data.lengthMinutes * 60;
      const baseXp = baseXPForTask(data.frequency, data.energy);
      const baseCoins = baseCoinsForTask(data.frequency, data.energy);
      const now = new Date().toISOString();
      const taskDate = new Date(data.date).toISOString();

      await supabase.from("tasks").insert({
        id: crypto.randomUUID(),
        user_profile_id: user.id,
        title: data.title,
        description: data.description,
        length: lengthSeconds,
        category: data.category,
        frequency: data.frequency,
        date: taskDate,
        energy_cost: data.energy,
        base_xp: baseXp,
        base_coins: baseCoins,
        created_at: now,
        updated_at: now,
        notification_frequency: "once",
        notification_type: "default",
        notification_sound: "default",
        notification_content: "",
        notification_category: "default",
        notification_timings: defaultNotificationTimings,
      });

      form.reset();
      onSuccess?.();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          {...form.register("title")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
        />
        {form.formState.errors.title && (
          <p className="mt-1 text-sm text-red-600">{form.formState.errors.title.message}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          {...form.register("description")}
          rows={2}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Duration (min)</label>
          <input
            type="number"
            {...form.register("lengthMinutes")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
          />
          {form.formState.errors.lengthMinutes && (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.lengthMinutes.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Energy (1–5)</label>
          <input
            type="number"
            min={1}
            max={5}
            {...form.register("energy")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            {...form.register("category")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
          >
            {TASK_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Frequency</label>
          <select
            {...form.register("frequency")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
          >
            {TASK_FREQUENCIES.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Date & time</label>
        <input
          type="datetime-local"
          {...form.register("date")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
        />
        {form.formState.errors.date && (
          <p className="mt-1 text-sm text-red-600">{form.formState.errors.date.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create task"}
      </button>
    </form>
  );
}
