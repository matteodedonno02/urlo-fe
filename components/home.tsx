"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShieldCheck, SignOut } from "@phosphor-icons/react";
import { ShortenPanel } from "@/components/shorten-panel";
import { ChangePasswordModal } from "@/components/change-password-modal";
import {
  fetchProfile,
  getMustChangePassword,
  getToken,
  logout,
  type AuthUser,
} from "@/lib/auth";

export function Home() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mustChange, setMustChange] = useState(false);
  const [prevUser, setPrevUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!getToken()) return;
    fetchProfile()
      .then(setUser)
      .catch(() => logout());
  }, []);

  if (prevUser !== user) {
    setPrevUser(user);
    setMustChange(Boolean(user?.role === "admin" && getMustChangePassword()));
  }

  return (
    <main className="min-h-[100dvh] flex-1 flex flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <Link href="/" className="font-mono text-sm font-semibold tracking-tight">
            urlo
          </Link>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-muted">{user.email}</span>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 font-mono text-xs text-foreground transition-colors hover:border-accent-link hover:text-accent-link active:translate-y-px"
                >
                  <ShieldCheck size={13} weight="regular" />
                  admin
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  logout();
                  setUser(null);
                }}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 font-mono text-xs text-foreground transition-colors hover:border-accent-link hover:text-accent-link active:translate-y-px"
              >
                <SignOut size={13} weight="regular" />
                sign out
              </button>
            </div>
          ) : (
            <span className="font-mono text-xs text-muted">short links</span>
          )}
        </div>
      </header>

      <ShortenPanel user={user} onUserChange={setUser} />

      <footer className="mt-auto border-t border-line">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-6">
          <span className="font-mono text-xs text-muted">urlo</span>
          <span className="text-xs text-muted">paste long. share short.</span>
        </div>
      </footer>

      {mustChange && user && (
        <ChangePasswordModal onDone={() => setMustChange(false)} />
      )}
    </main>
  );
}
