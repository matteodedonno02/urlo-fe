"use client";

import { useEffect, useState } from "react";
import { LockKey, SpinnerGap } from "@phosphor-icons/react";
import { changePassword } from "@/lib/auth";

const inputClass =
  "h-11 w-full rounded-xl border border-line bg-background px-4 font-mono text-sm text-foreground placeholder:text-muted focus:border-accent-link focus:outline-none focus:ring-2 focus:ring-accent-soft";

export function ChangePasswordModal({ onDone }: { onDone: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!current) {
      setError("Enter your current password.");
      return;
    }
    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setError("New passwords do not match.");
      return;
    }

    setPending(true);
    try {
      await changePassword(current, next);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        className="relative w-full max-w-md animate-rise rounded-xl border border-line bg-surface p-6 shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft">
            <LockKey size={18} weight="bold" className="text-accent-link" />
          </div>
          <div>
            <h2
              id="change-password-title"
              className="text-base font-semibold tracking-tight"
            >
              Change your password
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              You must set a new password before continuing.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4" noValidate>
          <div>
            <label htmlFor="current-password" className="mb-1.5 block font-mono text-xs text-muted">
              Current password
            </label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="current password"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="new-password" className="mb-1.5 block font-mono text-xs text-muted">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="8+ characters"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="mb-1.5 block font-mono text-xs text-muted">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="repeat new password"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 font-medium text-accent-ink transition-colors hover:brightness-110 active:translate-y-px disabled:opacity-60"
          >
            {pending ? <SpinnerGap size={16} className="animate-spin" /> : <LockKey size={16} weight="bold" />}
            {pending ? "updating" : "update password"}
          </button>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}
