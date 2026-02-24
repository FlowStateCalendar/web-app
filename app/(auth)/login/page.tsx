"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

const signInSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = signInSchema.extend({
  name: z.string().min(1, "Name is required"),
});

type SignInForm = z.infer<typeof signInSchema>;
type SignUpForm = z.infer<typeof signUpSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const signInForm = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", name: "" },
  });

  async function onSignIn(data: SignInForm) {
    setAuthError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  async function onSignUp(data: SignUpForm) {
    setAuthError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { full_name: data.name } },
      });
      if (error) throw error;
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6 rounded-xl bg-white p-6 shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Shift Habits</h1>
        <p className="mt-1 text-sm text-gray-500">
          {isSignUp ? "Create an account" : "Sign in to continue"}
        </p>
      </div>

      {authError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {authError}
        </div>
      )}

      {isSignUp ? (
        <form
          onSubmit={signUpForm.handleSubmit(onSignUp)}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              {...signUpForm.register("name")}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {signUpForm.formState.errors.name && (
              <p className="mt-1 text-sm text-red-600">
                {signUpForm.formState.errors.name.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              {...signUpForm.register("email")}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {signUpForm.formState.errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {signUpForm.formState.errors.email.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              {...signUpForm.register("password")}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {signUpForm.formState.errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {signUpForm.formState.errors.password.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Sign Up"}
          </button>
        </form>
      ) : (
        <form
          onSubmit={signInForm.handleSubmit(onSignIn)}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              {...signInForm.register("email")}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {signInForm.formState.errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {signInForm.formState.errors.email.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              {...signInForm.register("password")}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {signInForm.formState.errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {signInForm.formState.errors.password.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-gray-600">
        {isSignUp ? "Already have an account? " : "Need an account? "}
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setAuthError(null);
          }}
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          {isSignUp ? "Sign In" : "Sign Up"}
        </button>
      </p>
    </div>
  );
}
