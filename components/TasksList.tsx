"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NewTaskForm, type TaskForEdit } from "./NewTaskForm";

export type TaskListItem = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  category: string | null;
  length: number | null;
  frequency: string | null;
  energy_cost: number | null;
  notification_frequency: string | null;
  notification_type: string | null;
  notification_timings: { minutesBeforeEvent?: number; isEnabled?: boolean }[] | null;
};

export function TasksList({ tasks }: { tasks: TaskListItem[] }) {
  const router = useRouter();
  const [editingTask, setEditingTask] = useState<TaskListItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("tasks").delete().eq("id", id).eq("user_profile_id", user.id);
      setDeleteConfirmId(null);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  if (tasks.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500">
        No tasks yet. Create one below to get started.
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900">{task.title}</p>
                <p className="text-sm text-gray-500">
                  {new Date(task.date).toLocaleDateString()}
                  {" · "}
                  {Math.round((task.length ?? 0) / 60)} min
                  {task.category && ` · ${task.category}`}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(task)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(task.id)}
                  className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
            {deleteConfirmId === task.id && (
              <div className="mt-3 flex items-center gap-2 rounded-md bg-red-50 p-2 text-sm">
                <span className="text-red-800">Delete this task?</span>
                <button
                  type="button"
                  onClick={() => handleDelete(task.id)}
                  disabled={deleting}
                  className="rounded bg-red-600 px-2 py-1 font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Yes"}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="rounded bg-gray-200 px-2 py-1 font-medium text-gray-700 hover:bg-gray-300"
                >
                  No
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {editingTask && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit task</h3>
            <NewTaskForm
              task={editingTask as TaskForEdit}
              onSuccess={() => setEditingTask(null)}
              onCancelEdit={() => setEditingTask(null)}
            />
          </div>
        </div>
      )}
    </>
  );
}
