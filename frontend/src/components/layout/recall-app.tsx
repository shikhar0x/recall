"use client";

import * as React from "react";
import {
  Brain,
  FileText,
  LayoutDashboard,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecallHealth } from "@/lib/hooks/use-recall-health";
import { cn } from "@/lib/utils";
import { AssistantView } from "@/features/assistant";
import { DocumentPreviewDialog, DocumentsView } from "@/features/documents";
import { OverviewView } from "@/features/overview";
import { SearchView } from "@/features/search";
import { SettingsView } from "@/features/settings";
import type { RecallView, SearchSeed } from "@/types/recall";

interface NavItem {
  view: RecallView;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { view: "overview", label: "Overview", icon: LayoutDashboard },
  { view: "documents", label: "Documents", icon: FileText },
  { view: "search", label: "Search", icon: Search },
  { view: "assistant", label: "AI Assistant", icon: Sparkles },
  { view: "settings", label: "Settings", icon: Settings },
];

/**
 * Application shell: sidebar (desktop), sticky mobile header, global search,
 * the five client-side views (all kept mounted so state survives navigation)
 * and a sticky-bottom footer.
 */
export function RecallApp() {
  const {
    health,
    loading: healthLoading,
    error: healthError,
    refresh: refreshHealth,
  } = useRecallHealth();

  const [view, setView] = React.useState<RecallView>("overview");
  const [searchSeed, setSearchSeed] = React.useState<SearchSeed | null>(null);
  const [globalQuery, setGlobalQuery] = React.useState("");
  const [previewId, setPreviewId] = React.useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const seedNonce = React.useRef(0);

  const navigate = React.useCallback((next: RecallView) => {
    setView(next);
  }, []);

  const openDocument = React.useCallback((id: number) => {
    setPreviewId(id);
    setPreviewOpen(true);
  }, []);

  const runSearch = React.useCallback((query: string) => {
    const q = query.trim();
    if (!q) return;
    seedNonce.current += 1;
    setSearchSeed({ query: q, nonce: seedNonce.current });
    setView("search");
  }, []);

  const submitGlobalSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    runSearch(globalQuery);
  };

  const aiConfigured = health ? health.aiConfigured : null;
  const backendUp = health !== null;

  const renderStatusDot = (extra?: string) => (
    <span
      className={cn(
        "size-2 shrink-0 rounded-full",
        healthLoading && !health
          ? "animate-pulse bg-amber-400"
          : backendUp
            ? "bg-emerald-400"
            : "bg-red-400",
        extra
      )}
      aria-hidden="true"
    />
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800/60 bg-slate-950/40 md:flex">
        <div className="flex items-center gap-3 px-5 py-5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300">
            <Brain className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-base font-semibold tracking-tight text-slate-100">
              Recall
            </p>
            <p className="text-[11px] uppercase tracking-widest text-slate-500">
              DSA mini project
            </p>
          </div>
        </div>

        <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-1 px-3 py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = view === item.view;
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => navigate(item.view)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-emerald-400/10 text-emerald-300"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-slate-800/60 px-5 py-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {renderStatusDot()}
            Local Java backend
          </div>
        </div>
      </aside>

      {/* Main column — min-w-0 lets it shrink below the mobile nav's
          min-content width so the nav's overflow-x-auto can scroll instead. */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:min-h-0">
        {/* Mobile sticky header */}
        <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-background/95 backdrop-blur md:hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300">
              <Brain className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-100">Recall</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">
                DSA mini project
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "ml-auto shrink-0 border-slate-700 text-[10px]",
                aiConfigured === false
                  ? "text-amber-300"
                  : "text-emerald-300"
              )}
            >
              {healthLoading && !health
                ? "Checking…"
                : aiConfigured
                  ? "AI ready"
                  : aiConfigured === false
                    ? "AI not configured"
                    : "AI offline"}
            </Badge>
          </div>
          <nav
            aria-label="Mobile navigation"
            className="flex gap-1 overflow-x-auto px-3 pb-2 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-800"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = view === item.view;
              return (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => navigate(item.view)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs transition-colors",
                    active
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </header>

        {/* Desktop header */}
        <header className="hidden items-center gap-4 border-b border-slate-800/60 px-4 py-3 md:flex md:px-8">
          <p className="shrink-0 text-sm font-semibold text-slate-100">
            Recall
          </p>
          <form
            role="search"
            onSubmit={submitGlobalSearch}
            className="relative ml-auto w-full max-w-md"
          >
            <Label htmlFor="global-search" className="sr-only">
              Search your documents
            </Label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <Input
              id="global-search"
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              placeholder="Search your documents…"
              className="min-h-[44px] border-slate-800 bg-slate-900/60 pl-9 text-sm"
            />
          </form>
          {healthLoading && !health ? (
            <Skeleton className="h-6 w-28 shrink-0 bg-slate-800" />
          ) : (
            <Badge
              variant="outline"
              className={cn(
                "shrink-0 border-emerald-400/30 text-xs",
                aiConfigured
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                  : "border-amber-400/30 bg-amber-400/10 text-amber-300"
              )}
            >
              {backendUp
                ? aiConfigured
                  ? "AI ready"
                  : "AI not configured"
                : "Backend offline"}
            </Badge>
          )}
        </header>

        {/* Views — kept mounted so state (chat, results, lists) survives navigation */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className={view === "overview" ? undefined : "hidden"}>
            <OverviewView
              health={health}
              healthLoading={healthLoading}
              healthError={healthError}
              onRefreshHealth={() => void refreshHealth()}
              onNavigate={navigate}
              onOpenDocument={openDocument}
              onSearch={runSearch}
            />
          </div>
          <div className={view === "documents" ? undefined : "hidden"}>
            <DocumentsView
              onOpenDocument={openDocument}
              onLibraryChanged={() => void refreshHealth()}
            />
          </div>
          <div className={view === "search" ? undefined : "hidden"}>
            <SearchView seed={searchSeed} onOpenDocument={openDocument} />
          </div>
          <div className={view === "assistant" ? undefined : "hidden"}>
            <AssistantView
              aiConfigured={aiConfigured}
              onOpenDocument={openDocument}
            />
          </div>
          <div className={view === "settings" ? undefined : "hidden"}>
            <SettingsView />
          </div>
        </main>

        {/* Sticky-bottom footer: mt-auto keeps it at the bottom on short pages
            and pushes it down naturally on long ones. */}
        <footer className="mt-auto border-t border-slate-800/60 px-4 py-4 text-xs text-slate-500">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Recall keeps your documents local. Only selected passages are
              sent to Groq when you use AI features.
            </p>
            <p className="shrink-0 sm:pl-4">
              Custom Java search engine · DSA mini project
            </p>
          </div>
        </footer>
      </div>

      <DocumentPreviewDialog
        documentId={previewId}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
