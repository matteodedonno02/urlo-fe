"use client";

import { useState } from "react";
import { SpinnerGap } from "@phosphor-icons/react";
import { fetchProfile, login, register, type AuthUser } from "@/lib/auth";

type Mode = "login" | "register";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function AuthForm({ onUserChange }: { onUserChange: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (mode === "register" && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!password) {
      setError("Enter a password.");
      return;
    }

    setPending(true);
    try {
      if (mode === "register") {
        await register(email.trim(), password);
        await login(email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      const user = await fetchProfile();
      onUserChange(user);
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  const tabs: { id: Mode; label: string }[] = [
    { id: "login", label: "sign in" },
    { id: "register", label: "create account" },
  ];

  return (
    <div className="max-w-2xl">
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="flex gap-1 rounded-lg border border-line p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setMode(tab.id);
                setError(null);
              }}
              className={`flex-1 rounded-md px-3 py-1.5 font-mono text-xs transition-colors ${
                mode === tab.id
                  ? "bg-accent text-accent-ink"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3" noValidate>
          <label htmlFor="auth-email" className="sr-only">
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-12 flex-1 rounded-xl border border-line bg-background px-4 font-mono text-sm text-foreground placeholder:text-muted focus:border-accent-link focus:outline-none focus:ring-2 focus:ring-accent-soft"
          />
          <label htmlFor="auth-password" className="sr-only">
            Password
          </label>
          <input
            id="auth-password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "register" ? "8+ characters" : "password"}
            className="h-12 flex-1 rounded-xl border border-line bg-background px-4 font-mono text-sm text-foreground placeholder:text-muted focus:border-accent-link focus:outline-none focus:ring-2 focus:ring-accent-soft"
          />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-5 font-medium text-accent-ink transition-colors hover:brightness-110 active:translate-y-px disabled:opacity-60"
          >
            {pending ? (
              <SpinnerGap size={16} className="animate-spin" />
            ) : (
              (mode === "login" ? "sign in" : "create account")
            )}
          </button>
        </form>
        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}
