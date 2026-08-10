import Link from "next/link";
import { ShortenPanel } from "@/components/shorten-panel";

export default function Home() {
  return (
    <main className="min-h-[100dvh] flex-1 flex flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <Link href="/" className="font-mono text-sm font-semibold tracking-tight">
            urlo
          </Link>
          <span className="font-mono text-xs text-muted">short links</span>
        </div>
      </header>

      <ShortenPanel />

      <footer className="mt-auto border-t border-line">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-6">
          <span className="font-mono text-xs text-muted">urlo</span>
          <span className="text-xs text-muted">paste long. share short.</span>
        </div>
      </footer>
    </main>
  );
}
