"use client";

import * as React from "react";
import {
  Database,
  KeyRound,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecallHealth } from "@/lib/hooks/use-recall-health";
import { ErrorBanner } from "@/components/common/error-banner";

export function SettingsView() {
  const { health, loading, error, refresh } = useRecallHealth();

  const connected = health !== null;
  const checking = loading && !connected;

  return (
    <section aria-label="Settings" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-100">
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Backend, AI and runtime status. Read-only — configuration lives on
            the Java side.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void refresh()}
          disabled={loading}
          className="min-h-[44px] border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:text-slate-100"
        >
          <RefreshCw className={loading ? "animate-spin" : undefined} aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {error ? <ErrorBanner message={error} onRetry={() => void refresh()} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Backend connection */}
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-slate-100">
              <Server className="size-4 text-emerald-300" aria-hidden="true" />
              Backend connection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span
                className={`size-2 shrink-0 rounded-full ${
                  checking
                    ? "animate-pulse bg-amber-400"
                    : connected
                      ? "bg-emerald-400"
                      : "bg-red-400"
                }`}
                aria-hidden="true"
              />
              <span className="text-sm font-medium text-slate-200">
                {checking ? "Checking…" : connected ? "Connected" : "Offline"}
              </span>
            </div>
            <p className="break-words font-mono text-xs text-slate-400">
              local Java service via gateway (/api → port 8080)
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refresh()}
              className="min-h-[44px] border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:text-slate-100"
            >
              Retry connection
            </Button>
          </CardContent>
        </Card>

        {/* AI configuration */}
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-slate-100">
              <KeyRound className="size-4 text-emerald-300" aria-hidden="true" />
              AI configuration
            </CardTitle>
            <CardDescription className="text-slate-400">
              Groq credentials are managed only on the backend.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {checking ? (
              <Skeleton className="h-10 w-full bg-slate-800" />
            ) : health?.aiConfigured ? (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-200">
                <Sparkles className="size-4 shrink-0" aria-hidden="true" />
                <span>
                  Configured · model{" "}
                  <span className="font-mono">{health.aiModel}</span>
                </span>
              </div>
            ) : connected ? (
              <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
                GROQ_API_KEY is not set on the backend. Keys live only in
                backend environment variables — this page can never display or
                edit them.
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Unknown while the backend is unreachable.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Library */}
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-slate-100">
              <Database className="size-4 text-emerald-300" aria-hidden="true" />
              Library
            </CardTitle>
            <CardDescription className="text-slate-400">
              Everything is stored in a local SQLite database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {checking ? (
              <>
                <Skeleton className="h-5 w-2/3 bg-slate-800" />
                <Skeleton className="h-5 w-1/2 bg-slate-800" />
                <Skeleton className="h-5 w-full bg-slate-800" />
              </>
            ) : health ? (
              <>
                <p className="text-sm text-slate-300">
                  Documents:{" "}
                  <span className="font-semibold tabular-nums text-slate-100">
                    {health.documentCount.toLocaleString()}
                  </span>
                </p>
                <p className="text-sm text-slate-300">
                  Total words:{" "}
                  <span className="font-semibold tabular-nums text-slate-100">
                    {health.totalWords.toLocaleString()}
                  </span>
                </p>
                <p className="break-all font-mono text-xs text-slate-400">
                  {health.dbPath}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-500">
                Unavailable while the backend is offline.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Runtime */}
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-slate-100">
              <Server className="size-4 text-emerald-300" aria-hidden="true" />
              Runtime
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {checking ? (
              <>
                <Skeleton className="h-5 w-2/3 bg-slate-800" />
                <Skeleton className="h-5 w-1/2 bg-slate-800" />
                <Skeleton className="h-10 w-full bg-slate-800" />
              </>
            ) : health ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-slate-700 text-xs text-slate-300"
                  >
                    {health.app}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-slate-700 text-xs text-slate-400"
                  >
                    v{health.version}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-slate-700 text-xs text-slate-400"
                  >
                    Java {health.javaVersion}
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed text-slate-400">
                  Search engine: custom linear scan + normalized
                  term-frequency scoring + hand-written insertion sort (no
                  HashMap, no inverted index).
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-500">
                Unavailable while the backend is offline.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Privacy */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-slate-100">
            <ShieldCheck className="size-4 text-emerald-300" aria-hidden="true" />
            About privacy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2.5">
            {[
              "Search is fully local — it runs in Java against your SQLite database.",
              "AI features send only the retrieved passages to Groq, never your whole library.",
              "Nothing leaves this machine without an explicit AI action.",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <span
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-400"
                  aria-hidden="true"
                />
                <span className="text-sm leading-relaxed text-slate-300">
                  {line}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
