import { createClient } from "@/lib/supabase/server";
import { TasksList } from "@/components/TasksList";
import { NewTaskForm } from "@/components/NewTaskForm";

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, date, category, length")
    .eq("user_profile_id", user?.id)
    .order("date", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Tasks</h1>
      </header>

      <TasksList tasks={tasks ?? []} />
      <details className="mt-6 rounded-lg border border-gray-200 bg-white shadow-sm">
        <summary className="cursor-pointer px-4 py-3 font-medium text-gray-900">
          Add new task
        </summary>
        <div className="border-t border-gray-200 p-4">
          <NewTaskForm />
        </div>
      </details>
    </div>
  );
}
