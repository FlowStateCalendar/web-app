"use client";

type Task = {
  id: string;
  title: string;
  date: string;
  category: string | null;
  length: number | null;
};

export function TasksList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500">
        No tasks yet. Create one below to get started.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <p className="font-medium text-gray-900">{task.title}</p>
          <p className="text-sm text-gray-500">
            {new Date(task.date).toLocaleDateString()}
            {" · "}
            {Math.round((task.length ?? 0) / 60)} min
            {task.category && ` · ${task.category}`}
          </p>
        </li>
      ))}
    </ul>
  );
}
