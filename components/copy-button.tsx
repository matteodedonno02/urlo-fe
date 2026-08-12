"use client";

import { useState } from "react";
import { Check, Copy } from "@phosphor-icons/react";

export function CopyButton({ text, label }: { text: string; label?: string }) {
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
