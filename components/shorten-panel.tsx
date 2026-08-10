"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Clock, Copy, LinkBreak, SpinnerGap } from "@phosphor-icons/react";
import {
  createShortUrl,
  listShortUrls,
  shortUrlFor,
  type ShortUrl,
} from "@/lib/urls";
import type { AuthUser } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 font-mono text-xs text-foreground transition-colors hover:border-accent-link hover:text-accent-link active:translate-y-px"
    >
      {copied ? (
        <Check size={14} weight="bold" />
      ) : (
        <Copy size={14} weight="regular" />
      )}
      {label ?? (copied ? "copied" : "copy")}
    </button>
  );
}

export function ShortenPanel({
  user,
  onUserChange,
}: {
  user: AuthUser | null;
  onUserChange: (user: AuthUser) => void;
}) {
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ShortUrl | null>(null);
  const [links, setLinks] = useState<ShortUrl[]>([]);
  const [linksLoading, setLinksLoading] = useState(true);
  const [linksError, setLinksError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listShortUrls()
      .then((links) => {
        if (cancelled) return;
        setLinks(links);
        setLinksLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLinksError(err instanceof Error ? err.message : "Could not load links.");
        setLinksLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!value.trim()) {
      setError("Paste a link to shorten.");
      return;
    }

    const url = normalizeUrl(value);
    if (!isValidUrl(url)) {
      setError("That does not look like a valid link.");
      return;
    }

    setPending(true);
    try {
      const link = await createShortUrl(url);
      setResult(link);
      setLinks((prev) => [link, ...prev.filter((l) => l.id !== link.id)].slice(0, 20));
      setValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not shorten this link.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-6">
      <section className="pt-16 md:pt-24">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent-link">
          url shortener
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-[1.05] tracking-tighter md:text-6xl">
          Short links, nothing else.
        </h1>
        <p className="mt-5 max-w-[55ch] text-base leading-relaxed text-muted md:text-lg">
          Paste a long URL and get a short link you can share anywhere.
        </p>

        {user ? (
          <form onSubmit={onSubmit} className="mt-10 max-w-2xl" noValidate>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <label htmlFor="url-input" className="sr-only">
                Link to shorten
              </label>
              <input
                id="url-input"
                type="text"
                inputMode="url"
                autoComplete="off"
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="https://example.com/some/very/long/path"
                className="h-12 flex-1 rounded-xl border border-line bg-surface px-4 font-mono text-sm text-foreground placeholder:text-muted focus:border-accent-link focus:outline-none focus:ring-2 focus:ring-accent-soft"
              />
              <button
                type="submit"
                disabled={pending}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-5 font-medium text-accent-ink transition-colors hover:brightness-110 active:translate-y-px disabled:opacity-60"
              >
                {pending ? (
                  <SpinnerGap size={16} className="animate-spin" />
                ) : (
                  <ArrowRight size={16} weight="bold" />
                )}
                {pending ? "shortening" : "shorten"}
              </button>
            </div>
            {error && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </form>
        ) : (
          <div className="mt-10">
            <AuthForm onUserChange={onUserChange} />
          </div>
        )}
      </section>

      {result && (
        <section aria-label="Shortened link" className="mt-8 max-w-2xl animate-rise">
          <div className="rounded-xl border border-line bg-surface p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-mono text-xs text-muted">your short link</p>
                <a
                  href={shortUrlFor(result.shortCode)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block truncate font-mono text-lg font-medium text-accent-link hover:underline"
                >
                  {shortUrlFor(result.shortCode)}
                </a>
                <p className="mt-1 truncate text-xs text-muted">{result.originalUrl}</p>
              </div>
              <CopyButton text={shortUrlFor(result.shortCode)} />
            </div>
          </div>
        </section>
      )}

      {user && (
        <section className="pb-24 pt-16 md:pt-20">
        <div className="mb-4 flex items-center gap-2">
          <Clock size={15} weight="regular" className="text-muted" />
          <h2 className="text-sm font-medium tracking-tight">Recent links</h2>
        </div>

        {linksLoading ? (
          <div className="max-w-2xl space-y-2" role="status" aria-label="Loading recent links">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-xl border border-line bg-surface"
              />
            ))}
          </div>
        ) : linksError ? (
          <div className="flex max-w-2xl flex-col items-center gap-3 rounded-xl border border-dashed border-line py-14 text-center">
            <LinkBreak size={28} weight="regular" className="text-muted" />
            <p className="text-sm text-muted">{linksError}</p>
          </div>
        ) : links.length === 0 ? (
          <div className="flex max-w-2xl flex-col items-center gap-3 rounded-xl border border-dashed border-line py-14 text-center">
            <LinkBreak size={28} weight="regular" className="text-muted" />
            <p className="text-sm text-muted">No links yet. Shorten your first one above.</p>
          </div>
        ) : (
          <ul className="max-w-2xl overflow-hidden rounded-xl border border-line divide-y divide-line bg-surface">
            {links.map((link) => (
              <li key={link.id} className="flex items-center gap-4 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <a
                    href={shortUrlFor(link.shortCode)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-sm text-accent-link hover:underline"
                  >
                    /{link.shortCode}
                  </a>
                  <p className="truncate text-xs text-muted">{link.originalUrl}</p>
                </div>
                <div className="hidden shrink-0 items-center gap-4 sm:flex">
                  <span className="font-mono text-xs text-muted">
                    {link.visitCount} visit{link.visitCount === 1 ? "" : "s"}
                  </span>
                  <span className="font-mono text-xs text-muted">
                    {formatRelative(link.createdAt)}
                  </span>
                  <CopyButton text={shortUrlFor(link.shortCode)} />
                </div>
                <div className="flex shrink-0 items-center gap-3 sm:hidden">
                  <span className="font-mono text-xs text-muted">
                    {link.visitCount} visit{link.visitCount === 1 ? "" : "s"}
                  </span>
                  <CopyButton text={shortUrlFor(link.shortCode)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      )}
    </div>
  );
}
