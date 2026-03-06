"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

const schema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "expired" | "success">("loading");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus("ready");
      } else {
        setStatus("expired");
      }
    });
  }, []);

  async function onSubmit(data: FormData) {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password: data.password });
      if (updateError) throw updateError;
      setStatus("success");
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-md">
          <h1 className="text-xl font-semibold text-gray-900">Link expired or invalid</h1>
          <p className="mt-2 text-sm text-gray-500">
            This reset link may have expired. Please request a new one from the login page.
          </p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="mt-4 w-full rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-md text-center">
          <p className="text-green-600 font-medium">Password updated. Redirecting to dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-md">
        <h1 className="text-xl font-semibold text-gray-900">Set new password</h1>
        <p className="mt-1 text-sm text-gray-500">Enter your new password below.</p>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">New password</label>
            <input
              type="password"
              {...form.register("password")}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
            />
            {form.formState.errors.password && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.password.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm password</label>
            <input
              type="password"
              {...form.register("confirmPassword")}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
            />
            {form.formState.errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
