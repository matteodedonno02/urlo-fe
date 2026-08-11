"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CaretDown,
  CaretRight,
  LinkBreak,
  LockKey,
  MagnifyingGlass,
  ShieldCheck,
  SignIn,
  Users,
} from "@phosphor-icons/react";
import { ChangePasswordModal } from "@/components/change-password-modal";
import { fetchProfile, getMustChangePassword, logout, type AuthUser } from "@/lib/auth";
import {
  listUserShortUrls,
  listUsers,
  type AdminShortUrl,
  type AdminUser,
} from "@/lib/admin";
import { shortUrlFor } from "@/lib/urls";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RoleBadge({ role }: { role: AdminUser["role"] }) {
  if (role === "admin") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-0.5 font-mono text-[11px] text-accent-ink">
        <ShieldCheck size={11} weight="bold" />
        admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md border border-line px-2 py-0.5 font-mono text-[11px] text-muted">
      standard
    </span>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="font-mono text-2xl leading-none text-foreground">{value}</p>
      <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-muted">
        {label}
      </p>
    </div>
  );
}

function ShortUrlRow({ link }: { link: AdminShortUrl }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <a
          href={shortUrlFor(link.shortCode)}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-xs text-accent-link hover:underline"
        >
          /{link.shortCode}
        </a>
        <p className="truncate text-xs text-muted">{link.originalUrl}</p>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <span className="font-mono text-[11px] text-muted">
          {link.visitCount} visit{link.visitCount === 1 ? "" : "s"}
        </span>
        <span className="hidden font-mono text-[11px] text-muted sm:block">
          {formatDate(link.createdAt)}
        </span>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [phase, setPhase] = useState<"booting" | "guest" | "forbidden" | "ready">(
    "booting",
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mustChange, setMustChange] = useState(false);
  const [prevUser, setPrevUser] = useState<AuthUser | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, AdminShortUrl[] | "loading" | "error">>({});

  useEffect(() => {
    let cancelled = false;
    fetchProfile()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        if (me.role !== "admin") {
          setPhase("forbidden");
          return;
        }
        setPhase("ready");
        listUsers()
          .then((list) => {
            if (cancelled) return;
            setUsers(list);
          })
          .catch((err: unknown) => {
            if (cancelled) return;
            setLoadError(
              err instanceof Error ? err.message : "Could not load users.",
            );
          });
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

  if (prevUser !== user) {
    setPrevUser(user);
    setMustChange(Boolean(user?.role === "admin" && getMustChangePassword()));
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q),
    );
  }, [users, query]);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      if (prev[id]) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      listUserShortUrls(id)
        .then((links) =>
          setExpanded((p) => ({ ...p, [id]: links })),
        )
        .catch(() => setExpanded((p) => ({ ...p, [id]: "error" })));
      return { ...prev, [id]: "loading" };
    });
  }

  function retryLoad() {
    setLoadError(null);
    listUsers()
      .then(setUsers)
      .catch((err: unknown) =>
        setLoadError(
          err instanceof Error ? err.message : "Could not load users.",
        ),
      );
  }

  const adminCount = users.filter((u) => u.role === "admin").length;
  const standardCount = users.length - adminCount;

  return (
    <main className="flex min-h-[100dvh] flex-1 flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <Link href="/" className="font-mono text-sm font-semibold tracking-tight">
            urlo
          </Link>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-muted">{user.email}</span>
              <Link
                href="/"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 font-mono text-xs text-foreground transition-colors hover:border-accent-link hover:text-accent-link active:translate-y-px"
              >
                <ArrowLeft size={13} weight="regular" />
                back to app
              </Link>
            </div>
          ) : (
            <span className="font-mono text-xs text-muted">admin</span>
          )}
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl flex-1 px-6">
        {phase === "booting" && (
          <section className="pt-16 md:pt-24">
            <div className="space-y-3" role="status" aria-label="Loading dashboard">
              <div className="h-3 w-24 animate-pulse rounded bg-surface" />
              <div className="h-10 w-56 animate-pulse rounded bg-surface" />
              <div className="h-4 w-80 max-w-full animate-pulse rounded bg-surface" />
              <div className="grid max-w-xl grid-cols-3 gap-3 pt-6">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-xl border border-line bg-surface" />
                ))}
              </div>
              <div className="space-y-2 pt-8">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl border border-line bg-surface" />
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
                This dashboard is for admins only. Sign in on the app to continue.
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

        {phase === "forbidden" && (
          <section className="flex flex-col items-center gap-4 pt-16 md:pt-24">
            <div className="flex w-full max-w-xl flex-col items-center gap-3 rounded-xl border border-dashed border-line py-16 text-center">
              <LockKey size={28} weight="regular" className="text-muted" />
              <p className="max-w-[36ch] text-sm text-muted">
                You are signed in, but this account does not have admin access.
              </p>
              <Link
                href="/"
                className="mt-1 inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-5 font-medium text-accent-ink transition-colors hover:brightness-110 active:translate-y-px"
              >
                back to app
              </Link>
            </div>
          </section>
        )}

        {phase === "ready" && (
          <>
            <section className="pt-14 md:pt-20">
              <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-accent-link">
                <ShieldCheck size={14} weight="bold" />
                admin
              </p>
              <h1 className="mt-4 text-3xl font-semibold leading-[1.05] tracking-tighter md:text-5xl">
                Users
              </h1>
              <p className="mt-4 max-w-[55ch] text-sm leading-relaxed text-muted md:text-base">
                Every account on urlo and the links they have shortened.
              </p>
            </section>

            {loadError ? (
              <section className="mt-10 flex max-w-2xl flex-col items-center gap-3 rounded-xl border border-dashed border-line py-16 text-center">
                <LinkBreak size={28} weight="regular" className="text-muted" />
                <p className="text-sm text-muted">{loadError}</p>
                <button
                  type="button"
                  onClick={retryLoad}
                  className="mt-1 inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-5 font-medium text-accent-ink transition-colors hover:brightness-110 active:translate-y-px"
                >
                  retry
                </button>
              </section>
            ) : (
              <>
                <section className="mt-8 grid max-w-xl grid-cols-3 gap-3">
                  <StatTile label="total users" value={users.length} />
                  <StatTile label="admins" value={adminCount} />
                  <StatTile label="standard" value={standardCount} />
                </section>

                <section className="relative mt-8 max-w-md">
                  <MagnifyingGlass
                    size={15}
                    weight="regular"
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <label htmlFor="admin-search" className="sr-only">
                    Search users
                  </label>
                  <input
                    id="admin-search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by email or id"
                    className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-4 font-mono text-sm text-foreground placeholder:text-muted focus:border-accent-link focus:outline-none focus:ring-2 focus:ring-accent-soft"
                  />
                </section>

                {users.length === 0 ? (
                  <section className="mt-4 flex max-w-2xl flex-col items-center gap-3 rounded-xl border border-dashed border-line py-16 text-center">
                    <Users size={28} weight="regular" className="text-muted" />
                    <p className="text-sm text-muted">No users yet.</p>
                  </section>
                ) : filtered.length === 0 ? (
                  <section className="mt-4 flex max-w-2xl flex-col items-center gap-3 rounded-xl border border-dashed border-line py-16 text-center">
                    <MagnifyingGlass size={28} weight="regular" className="text-muted" />
                    <p className="text-sm text-muted">
                      No users match &quot;{query.trim()}&quot;.
                    </p>
                  </section>
                ) : (
                  <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
                    <div className="hidden grid-cols-[1fr_130px_180px_32px] items-center gap-4 border-b border-line px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-muted md:grid">
                      <span>email</span>
                      <span>role</span>
                      <span>created</span>
                      <span />
                    </div>
                    <ul className="divide-y divide-line">
                      {filtered.map((u) => {
                        const detail = expanded[u.id];
                        return (
                          <li key={u.id}>
                            <button
                              type="button"
                              onClick={() => toggleExpand(u.id)}
                              aria-expanded={Boolean(detail)}
                              className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-accent-soft/50 active:bg-accent-soft/70 md:grid-cols-[1fr_130px_180px_32px]"
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-medium text-foreground">
                                  {u.email}
                                </span>
                                <span className="block truncate font-mono text-[11px] text-muted">
                                  {u.id}
                                </span>
                              </span>
                              <span className="hidden md:block">
                                <RoleBadge role={u.role} />
                              </span>
                              <span className="hidden font-mono text-xs text-muted md:block">
                                {formatDate(u.createdAt)}
                              </span>
                              <span className="justify-self-end text-muted">
                                {detail ? (
                                  <CaretDown size={14} weight="bold" />
                                ) : (
                                  <CaretRight size={14} weight="bold" />
                                )}
                              </span>
                            </button>

                            {detail && (
                              <div className="border-t border-line bg-background px-5 py-4">
                                {detail === "loading" && (
                                  <div className="space-y-2" role="status" aria-label="Loading short URLs">
                                    {[0, 1].map((i) => (
                                      <div key={i} className="h-12 animate-pulse rounded-lg border border-line bg-surface" />
                                    ))}
                                  </div>
                                )}
                                {detail === "error" && (
                                  <p className="text-sm text-red-600 dark:text-red-400">
                                    Could not load this user&apos;s links.
                                  </p>
                                )}
                                {Array.isArray(detail) && detail.length === 0 && (
                                  <p className="text-sm text-muted">
                                    No links yet.
                                  </p>
                                )}
                                {Array.isArray(detail) && detail.length > 0 && (
                                  <div className="space-y-2">
                                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
                                      {detail.length} short link{detail.length === 1 ? "" : "s"}
                                    </p>
                                    <div className="grid gap-2">
                                      {detail.map((link) => (
                                        <ShortUrlRow key={link.id} link={link} />
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <footer className="mt-auto border-t border-line">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-6">
          <span className="font-mono text-xs text-muted">urlo</span>
          <span className="text-xs text-muted">admin dashboard</span>
        </div>
      </footer>

      {mustChange && user && (
        <ChangePasswordModal onDone={() => setMustChange(false)} />
      )}
    </main>
  );
}
