"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CaretDown,
  CaretLeft,
  CaretRight,
  LinkBreak,
  MagnifyingGlass,
  PencilSimple,
  SignIn,
  SignOut,
} from "@phosphor-icons/react";
import { CopyButton } from "@/components/copy-button";
import { EditUrlModal } from "@/components/edit-url-modal";
import { fetchProfile, logout, type AuthUser } from "@/lib/auth";
import {
  formatRelative,
  listMyShortUrls,
  shortUrlFor,
  type ShortUrl,
} from "@/lib/urls";

const LIMITS = [10, 20, 50];

const navButtonClass =
  "inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 font-mono text-xs text-foreground transition-colors hover:border-accent-link hover:text-accent-link active:translate-y-px";

const pageButtonClass =
  "inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 font-mono text-xs text-foreground transition-colors hover:border-accent-link hover:text-accent-link active:translate-y-px disabled:opacity-40 disabled:hover:border-line disabled:hover:text-foreground disabled:active:translate-y-0";

export function MyLinks() {
  const [phase, setPhase] = useState<"booting" | "guest" | "ready">("booting");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [query, setQuery] = useState("");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(20);
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const [retry, setRetry] = useState(0);
  const [items, setItems] = useState<ShortUrl[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ShortUrl | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchProfile()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        setPhase("ready");
      })
      .catch(() => {
        if (cancelled) return;
        logout();
        setPhase("guest");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(query.trim());
      setCursorStack([null]);
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const cursor = cursorStack[cursorStack.length - 1] ?? null;

  useEffect(() => {
    if (phase !== "ready") return;
    let cancelled = false;
    listMyShortUrls({ q, cursor: cursor ?? undefined, limit })
      .then((page) => {
        if (cancelled) return;
        setItems(page.items);
        setNextCursor(page.nextCursor);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Could not load your links.",
        );
        setItems([]);
        setNextCursor(null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [phase, q, cursor, limit, retry]);

  const atFirstPage = cursorStack.length === 1;

  function nextPage() {
    if (!nextCursor) return;
    setCursorStack((s) => [...s, nextCursor]);
  }

  function prevPage() {
    setCursorStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  }

  function changeLimit(next: number) {
    if (next === limit) return;
    setLimit(next);
    setCursorStack([null]);
  }

  function retryLoad() {
    setError(null);
    setLoading(true);
    setRetry((n) => n + 1);
  }

  function replaceItem(updated: ShortUrl) {
    setItems((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    );
    setEditing(null);
  }

  return (
    <main className="flex min-h-[100dvh] flex-1 flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <Link href="/" className="font-mono text-sm font-semibold tracking-tight">
            urlo
          </Link>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden font-mono text-xs text-muted sm:block">
                {user.email}
              </span>
              <Link href="/" className={navButtonClass}>
                <ArrowLeft size={13} weight="regular" />
                shorten
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setUser(null);
                }}
                className={navButtonClass}
              >
                <SignOut size={13} weight="regular" />
                sign out
              </button>
            </div>
          ) : (
            <span className="font-mono text-xs text-muted">my links</span>
          )}
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl flex-1 px-6">
        {phase === "booting" && (
          <section className="pt-16 md:pt-24">
            <div className="space-y-3" role="status" aria-label="Loading your links">
              <div className="h-3 w-24 animate-pulse rounded bg-surface" />
              <div className="h-10 w-64 animate-pulse rounded bg-surface" />
              <div className="h-4 w-80 max-w-full animate-pulse rounded bg-surface" />
              <div className="space-y-2 pt-8">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-xl border border-line bg-surface"
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {phase === "guest" && (
          <section className="flex flex-col items-center gap-4 pt-16 md:pt-24">
            <div className="flex w-full max-w-xl flex-col items-center gap-3 rounded-xl border border-dashed border-line py-16 text-center">
              <SignIn size={28} weight="regular" className="text-muted" />
              <p className="max-w-[36ch] text-sm text-muted">
                Sign in to browse, search, and edit your short links.
              </p>
              <Link
                href="/"
                className="mt-1 inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-5 font-medium text-accent-ink transition-colors hover:brightness-110 active:translate-y-px"
              >
                go to app
              </Link>
            </div>
          </section>
        )}

        {phase === "ready" && (
          <>
            <section className="pt-14 md:pt-20">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent-link">
                your library
              </p>
              <h1 className="mt-4 text-3xl font-semibold leading-[1.05] tracking-tighter md:text-5xl">
                My links
              </h1>
              <p className="mt-4 max-w-[55ch] text-sm leading-relaxed text-muted md:text-base">
                Every short link you own, searchable and one click from editing
                its destination.
              </p>
            </section>

            <section className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full max-w-md">
                <MagnifyingGlass
                  size={15}
                  weight="regular"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                />
                <label htmlFor="links-search" className="sr-only">
                  Search links
                </label>
                <input
                  id="links-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by short code or destination"
                  className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-4 font-mono text-sm text-foreground placeholder:text-muted focus:border-accent-link focus:outline-none focus:ring-2 focus:ring-accent-soft"
                />
              </div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="links-limit"
                  className="font-mono text-[11px] uppercase tracking-wider text-muted"
                >
                  per page
                </label>
                <div className="relative">
                  <select
                    id="links-limit"
                    value={limit}
                    onChange={(e) => changeLimit(Number(e.target.value))}
                    className="h-9 appearance-none rounded-lg border border-line bg-surface pl-3 pr-8 font-mono text-xs text-foreground focus:border-accent-link focus:outline-none"
                  >
                    {LIMITS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <CaretDown
                    size={12}
                    weight="bold"
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted"
                  />
                </div>
              </div>
            </section>

            {loading ? (
              <div className="mt-4 space-y-2" role="status" aria-label="Loading links">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-xl border border-line bg-surface"
                  />
                ))}
              </div>
            ) : error ? (
              <section className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-dashed border-line py-16 text-center">
                <LinkBreak size={28} weight="regular" className="text-muted" />
                <p className="text-sm text-muted">{error}</p>
                <button
                  type="button"
                  onClick={retryLoad}
                  className="mt-1 inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-5 font-medium text-accent-ink transition-colors hover:brightness-110 active:translate-y-px"
                >
                  retry
                </button>
              </section>
            ) : items.length === 0 ? (
              <section className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-dashed border-line py-16 text-center">
                <LinkBreak size={28} weight="regular" className="text-muted" />
                <p className="text-sm text-muted">
                  {q
                    ? `No links match "${q}".`
                    : "You have not shortened any links yet."}
                </p>
              </section>
            ) : (
              <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
                <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_90px_130px_minmax(0,1fr)] items-center gap-4 border-b border-line px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-muted md:grid">
                  <span>short link</span>
                  <span>destination</span>
                  <span>visits</span>
                  <span>created</span>
                  <span className="text-right">actions</span>
                </div>
                <ul className="divide-y divide-line">
                  {items.map((link) => (
                    <li
                      key={link.id}
                      className="flex flex-col gap-3 px-5 py-4 md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_90px_130px_minmax(0,1fr)] md:items-center md:gap-4"
                    >
                      <a
                        href={shortUrlFor(link.shortCode)}
                        target="_blank"
                        rel="noreferrer"
                        className="w-fit font-mono text-sm text-accent-link hover:underline"
                      >
                        /{link.shortCode}
                      </a>
                      <p
                        className="min-w-0 truncate text-xs text-muted"
                        title={link.originalUrl}
                      >
                        {link.originalUrl}
                      </p>
                      <span className="font-mono text-xs text-muted">
                        {link.visitCount} visit{link.visitCount === 1 ? "" : "s"}
                      </span>
                      <span className="font-mono text-xs text-muted">
                        {formatRelative(link.createdAt)}
                      </span>
                      <div className="flex items-center gap-2 md:justify-end">
                        <CopyButton text={shortUrlFor(link.shortCode)} />
                        <button
                          type="button"
                          onClick={() => setEditing(link)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 font-mono text-xs text-foreground transition-colors hover:border-accent-link hover:text-accent-link active:translate-y-px"
                        >
                          <PencilSimple size={14} weight="regular" />
                          edit
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!loading && !error && items.length > 0 && (
              <div className="mt-4 flex items-center justify-between">
                <span className="font-mono text-xs text-muted">
                  {items.length} link{items.length === 1 ? "" : "s"}
                  {nextCursor ? " · more pages" : ""}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={prevPage}
                    disabled={atFirstPage}
                    className={pageButtonClass}
                  >
                    <CaretLeft size={13} weight="bold" />
                    prev
                  </button>
                  <button
                    type="button"
                    onClick={nextPage}
                    disabled={!nextCursor}
                    className={pageButtonClass}
                  >
                    next
                    <CaretRight size={13} weight="bold" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <footer className="mt-auto border-t border-line">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-6">
          <span className="font-mono text-xs text-muted">urlo</span>
          <span className="text-xs text-muted">my links</span>
        </div>
      </footer>

      {editing && (
        <EditUrlModal
          url={editing}
          onClose={() => setEditing(null)}
          onSaved={replaceItem}
        />
      )}
    </main>
  );
}
