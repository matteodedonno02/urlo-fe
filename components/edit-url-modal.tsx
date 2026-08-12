"use client";

import { useEffect, useState } from "react";
import { PencilSimple, SpinnerGap, X } from "@phosphor-icons/react";
import {
  isValidUrl,
  normalizeUrl,
  updateShortUrlOriginalUrl,
  type ShortUrl,
} from "@/lib/urls";

const inputClass =
  "h-11 w-full rounded-xl border border-line bg-background px-4 font-mono text-sm text-foreground placeholder:text-muted focus:border-accent-link focus:outline-none focus:ring-2 focus:ring-accent-soft";

export function EditUrlModal({
  url,
  onClose,
  onSaved,
}: {
  url: ShortUrl;
  onClose: () => void;
  onSaved: (updated: ShortUrl) => void;
}) {
  const [value, setValue] = useState(url.originalUrl);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const target = normalizeUrl(value);
    if (!isValidUrl(target)) {
      setError("Enter a valid http(s) link.");
      return;
    }
    if (target === url.originalUrl) {
      onClose();
      return;
    }

    setPending(true);
    try {
      const updated = await updateShortUrlOriginalUrl(url.id, target);
      onSaved(updated);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update this link.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-url-title"
        className="relative w-full max-w-md animate-rise rounded-xl border border-line bg-surface p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-accent-soft/50 hover:text-foreground"
        >
          <X size={16} weight="regular" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft">
            <PencilSimple size={18} weight="bold" className="text-accent-link" />
          </div>
          <div>
            <h2
              id="edit-url-title"
              className="text-base font-semibold tracking-tight"
            >
              Edit link
            </h2>
            <p className="mt-0.5 font-mono text-xs text-muted">
              /{url.shortCode}
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4" noValidate>
          <div>
            <label
              htmlFor="edit-original-url"
              className="mb-1.5 block font-mono text-xs text-muted"
            >
              Original link
            </label>
            <input
              id="edit-original-url"
              type="text"
              inputMode="url"
              autoComplete="off"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="https://example.com/path"
              className={inputClass}
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-line bg-surface px-5 font-medium text-foreground transition-colors hover:border-accent-link hover:text-accent-link active:translate-y-px"
            >
              cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 font-medium text-accent-ink transition-colors hover:brightness-110 active:translate-y-px disabled:opacity-60"
            >
              {pending ? (
                <SpinnerGap size={16} className="animate-spin" />
              ) : (
                <PencilSimple size={16} weight="bold" />
              )}
              {pending ? "saving" : "save changes"}
            </button>
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}
