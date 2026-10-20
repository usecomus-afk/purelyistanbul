"use client";

import { AlertTriangle } from "lucide-react";

export function DemoSandboxBanner() {
  const isSandbox =
    (process.env.NEXT_PUBLIC_APP_MODE || "sandbox").toLowerCase() === "sandbox";

  if (!isSandbox) return null;

  return (
    <aside
      aria-label="Demo and Sandbox Notice"
      className="sticky top-0 inset-x-0 z-50 w-full bg-[#1F2421] text-amber-200 border-b border-amber-500/30 px-3 sm:px-4 py-2 sm:py-2.5 text-xs shadow-md"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 text-center leading-snug">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 hidden sm:inline-block" />
        <p className="font-medium tracking-tight">
          <strong className="text-amber-300 font-semibold uppercase tracking-wider mr-1.5">
            DEMO &amp; SANDBOX PREVIEW —
          </strong>
          <span>
            This platform is currently in testing mode. Listings, sample rates, and venues are displayed strictly for demonstration purposes. Bookings and transactions are disabled.
          </span>
        </p>
      </div>
    </aside>
  );
}
