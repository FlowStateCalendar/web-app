"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { TASK_CATEGORIES, TASK_FREQUENCIES } from "@/lib/task-utils";

const NOTIFICATION_FREQUENCIES = ["once", "daily", "weekly"] as const;
const NOTIFICATION_TYPES = ["default", "reminder", "silent"] as const;

const schema = z.object({
  title: z.string().min(1, "Title required"),
  description: z.string(),
  lengthMinutes: z.coerce.number().min(1).max(480),
  category: z.enum(TASK_CATEGORIES),
  frequency: z.enum(TASK_FREQUENCIES),
  energy: z.coerce.number().min(1).max(5),
  date: z.string().min(1, "Date required"),
  notification_frequency: z.enum(NOTIFICATION_FREQUENCIES),
  notification_type: z.enum(NOTIFICATION_TYPES),
  notifyMinutesBefore: z.coerce.number().min(0).max(1440),
});

type FormData = z.infer<typeof schema>;

export type TaskForEdit = {
  id: string;
  title: string;
  description: string | null;
  length: number | null;
  category: string | null;
  frequency: string | null;
  energy_cost: number | null;
  date: string;
  notification_frequency: string | null;
  notification_type: string | null;
  notification_timings: { minutesBeforeEvent?: number; isEnabled?: boolean }[] | null;
};

const defaultNotificationTimings = [{ minutesBeforeEvent: -15, isEnabled: true }];

function getDefaultNotificationTiming(timings: TaskForEdit["notification_timings"]): number {
  const first = Array.isArray(timings) && timings[0];
  if (first && typeof first.minutesBeforeEvent === "number") {
    return Math.abs(first.minutesBeforeEvent);
  }
  return 15;
}

export function NewTaskForm({
  onSuccess,
  task,
  onCancelEdit,
}: {
  onSuccess?: () => void;
  task?: TaskForEdit | null;
  onCancelEdit?: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(task?.id);

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
      notification_frequency: "once",
      notification_type: "default",
      notifyMinutesBefore: 15,
    },
  });

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description ?? "",
        lengthMinutes: Math.round((task.length ?? 0) / 60),
        category: (task.category ?? "work") as FormData["category"],
        frequency: (task.frequency ?? "once") as FormData["frequency"],
        energy: task.energy_cost ?? 1,
        date: new Date(task.date).toISOString().slice(0, 16),
        notification_frequency: (task.notification_frequency ?? "once") as FormData["notification_frequency"],
        notification_type: (task.notification_type ?? "default") as FormData["notification_type"],
        notifyMinutesBefore: getDefaultNotificationTiming(task.notification_timings),
      });
    }
  }, [task, form]);

  async function onSubmit(data: FormData) {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not signed in");

      const lengthSeconds = data.lengthMinutes * 60;
      const taskDate = new Date(data.date).toISOString();
      const notificationTimings = [
        { minutesBeforeEvent: -data.notifyMinutesBefore, isEnabled: true },
      ];
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (isEdit && task) {
        const res = await fetch(`${baseUrl}/functions/v1/task-update`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            taskId: task.id,
            title: data.title,
            description: data.description,
            length: lengthSeconds,
            category: data.category,
            frequency: data.frequency,
            date: taskDate,
            energy_cost: data.energy,
            notification_frequency: data.notification_frequency,
            notification_type: data.notification_type,
            notification_timings: notificationTimings,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error ?? `Request failed (${res.status})`);
      } else {
        const res = await fetch(`${baseUrl}/functions/v1/task-create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            title: data.title,
            description: data.description,
            length: lengthSeconds,
            category: data.category,
            frequency: data.frequency,
            date: taskDate,
            energy_cost: data.energy,
            notification_frequency: data.notification_frequency,
            notification_type: data.notification_type,
            notification_timings: notificationTimings,
            notifyMinutesBefore: data.notifyMinutesBefore,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error ?? `Request failed (${res.status})`);
      }

      form.reset();
      onSuccess?.();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save task");
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
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <p className="text-sm font-medium text-gray-700 mb-2">Notifications</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500">Frequency</label>
            <select
              {...form.register("notification_frequency")}
              className="mt-0.5 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
            >
              {NOTIFICATION_FREQUENCIES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500">Type</label>
            <select
              {...form.register("notification_type")}
              className="mt-0.5 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
            >
              {NOTIFICATION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-500">Notify (minutes before)</label>
            <input
              type="number"
              min={0}
              max={1440}
              {...form.register("notifyMinutesBefore")}
              className="mt-0.5 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
            />
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        {isEdit && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className={`${isEdit && onCancelEdit ? "flex-1" : "w-full"} rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50`}
        >
          {loading ? "Saving…" : isEdit ? "Update task" : "Create task"}
        </button>
      </div>
    </form>
  );
}
