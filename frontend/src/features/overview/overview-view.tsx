"use client";

import * as React from "react";
import {
  Files,
  FileText,
  RefreshCw,
  Search,
  Server,
  Sparkles,
  Type,
  Upload,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { recallApi, type DocumentSummary, type Health } from "@/lib/api/recall-api";
import type { RecallView } from "@/types/recall";
import { ErrorBanner } from "@/components/common/error-banner";

export interface OverviewViewProps {
  health: Health | null;
  healthLoading: boolean;
  healthError: string | null;
  onRefreshHealth: () => void;
  onNavigate: (view: RecallView) => void;
  onOpenDocument: (id: number) => void;
  onSearch: (query: string) => void;
}

export function OverviewView({
  health,
  healthLoading,
  healthError,
  onRefreshHealth,
  onNavigate,
  onOpenDocument,
  onSearch,
}: OverviewViewProps) {
  const [docs, setDocs] = React.useState<DocumentSummary[] | null>(null);
  const [docsLoading, setDocsLoading] = React.useState(true);
  const [docsError, setDocsError] = React.useState<string | null>(null);
  const [docsNonce, setDocsNonce] = React.useState(0);
  const [quickQuery, setQuickQuery] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    setDocsLoading(true);
    setDocsError(null);
    recallApi
      .listDocuments()
      .then((res) => {
        if (!cancelled) setDocs(res.documents);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setDocsError(
            err instanceof Error ? err.message : "Failed to load documents."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setDocsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [docsNonce]);

  const refreshAll = () => {
    setDocsNonce((n) => n + 1);
    onRefreshHealth();
  };

  const submitQuickSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = quickQuery.trim();
    if (q) onSearch(q);
  };

  const recent = docs?.slice(0, 5) ?? [];
  const offline = !healthLoading && health === null;

  return (
    <section aria-label="Overview" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-100">
            Overview
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Your local knowledge library at a glance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => onNavigate("documents")}
            className="min-h-[44px] bg-emerald-400 text-slate-950 hover:bg-emerald-300"
          >
            <Upload aria-hidden="true" />
            Import documents
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={refreshAll}
            disabled={healthLoading || docsLoading}
            className="min-h-[44px] border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:text-slate-100"
          >
            <RefreshCw className={healthLoading ? "animate-spin" : undefined} aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </div>

      {healthError ? (
        <ErrorBanner message={healthError} onRetry={onRefreshHealth} />
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total documents */}
        <Card className="gap-2 rounded-xl border-slate-800 bg-slate-900/50 py-4">
          <CardContent className="px-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Documents
              </span>
              <Files className="size-4 text-emerald-300" aria-hidden="true" />
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums text-slate-100">
              {healthLoading ? (
                <Skeleton className="h-8 w-14 bg-slate-800" />
              ) : health ? (
                health.documentCount.toLocaleString()
              ) : (
                "—"
              )}
            </div>
          </CardContent>
        </Card>

        {/* Total words */}
        <Card className="gap-2 rounded-xl border-slate-800 bg-slate-900/50 py-4">
          <CardContent className="px-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Total words
              </span>
              <Type className="size-4 text-emerald-300" aria-hidden="true" />
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums text-slate-100">
              {healthLoading ? (
                <Skeleton className="h-8 w-20 bg-slate-800" />
              ) : health ? (
                health.totalWords.toLocaleString()
              ) : (
                "—"
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI status */}
        <Card className="gap-2 rounded-xl border-slate-800 bg-slate-900/50 py-4">
          <CardContent className="px-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                AI status
              </span>
              <Sparkles className="size-4 text-emerald-300" aria-hidden="true" />
            </div>
            <div className="mt-2">
              {healthLoading ? (
                <Skeleton className="h-6 w-28 bg-slate-800" />
              ) : health ? (
                health.aiConfigured ? (
                  <Badge className="border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                    Ready · {health.aiModel}
                  </Badge>
                ) : (
                  <Badge className="border-amber-400/30 bg-amber-400/10 text-amber-300">
                    Not configured
                  </Badge>
                )
              ) : (
                <Badge className="border-slate-700 bg-slate-800/60 text-slate-400">
                  Unknown
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Backend status */}
        <Card className="gap-2 rounded-xl border-slate-800 bg-slate-900/50 py-4">
          <CardContent className="px-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Backend
              </span>
              <Server className="size-4 text-emerald-300" aria-hidden="true" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`size-2 shrink-0 rounded-full ${
                  healthLoading && !health
                    ? "animate-pulse bg-amber-400"
                    : health
                      ? "bg-emerald-400"
                      : "bg-red-400"
                }`}
                aria-hidden="true"
              />
              <span className="text-lg font-semibold text-slate-100">
                {healthLoading && !health
                  ? "Checking…"
                  : health
                    ? "Connected"
                    : "Offline"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent documents */}
        <Card className="border-slate-800 bg-slate-900/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base text-slate-100">
              Recent documents
            </CardTitle>
            <CardDescription className="text-slate-400">
              The five most recently imported files. Click one to preview it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {docsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-11 w-full bg-slate-800" />
                <Skeleton className="h-11 w-full bg-slate-800" />
                <Skeleton className="h-11 w-full bg-slate-800" />
              </div>
            ) : docsError ? (
              <ErrorBanner
                message={docsError}
                onRetry={() => setDocsNonce((n) => n + 1)}
              />
            ) : recent.length === 0 ? (
              <p className="py-4 text-sm text-slate-500">
                No documents yet — import your first .txt or .md file to get
                started.
              </p>
            ) : (
              <ul className="divide-y divide-slate-800/70">
                {recent.map((d) => (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => onOpenDocument(d.id)}
                      className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-slate-800/60"
                    >
                      <FileText
                        className="size-4 shrink-0 text-emerald-300/80"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-200">
                        {d.fileName}
                      </span>
                      <span className="shrink-0 text-xs text-slate-500">
                        {d.wordCount.toLocaleString()} words
                      </span>
                      <span className="hidden shrink-0 text-xs text-slate-500 sm:block">
                        {new Date(d.importedAt).toLocaleString()}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Quick search + how it works */}
        <div className="flex flex-col gap-4">
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-base text-slate-100">
                Quick search
              </CardTitle>
              <CardDescription className="text-slate-400">
                Run the local Java engine from here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitQuickSearch} className="space-y-2">
                <Label htmlFor="overview-quick-search" className="sr-only">
                  Quick search
                </Label>
                <Input
                  id="overview-quick-search"
                  value={quickQuery}
                  onChange={(e) => setQuickQuery(e.target.value)}
                  placeholder="e.g. insertion sort, recursion"
                  className="min-h-[44px] border-slate-800 bg-slate-950/60 text-sm"
                />
                <Button
                  type="submit"
                  disabled={quickQuery.trim().length === 0}
                  className="min-h-[44px] w-full bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                >
                  <Search aria-hidden="true" />
                  Search
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-base text-slate-100">
                How Recall works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {[
                  "Import .txt or .md files — they are parsed and indexed locally.",
                  "Local Java search — linear scan, relevance scoring, insertion sort.",
                  "Optional Groq answers — only the most relevant passages leave your machine.",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-[11px] font-semibold text-emerald-300">
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed text-slate-300">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>

      {offline ? (
        <Alert className="border-amber-400/30 bg-amber-400/10 text-amber-200 [&>svg]:text-amber-300">
          <Server aria-hidden="true" />
          <AlertTitle>Backend offline</AlertTitle>
          <AlertDescription>
            Stats and document lists need the Java backend on port 8080. Press
            Retry once it is running.
          </AlertDescription>
        </Alert>
      ) : null}
    </section>
  );
}
