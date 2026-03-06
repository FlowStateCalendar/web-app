"use client";

import { useState } from "react";

export function ExpandableSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 text-left font-medium text-gray-900 hover:bg-gray-50/50"
      >
        {title}
        <span className="text-gray-400">{open ? "▼" : "▶"}</span>
      </button>
      {open && <div className="pb-4 pl-0">{children}</div>}
    </div>
  );
}
