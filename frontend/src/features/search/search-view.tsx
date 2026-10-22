"use client";

import * as React from "react";
import { FileText, ListOrdered, Search, SearchX } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  recallApi,
  type SearchResponse,
  type SearchResult,
} from "@/lib/api/recall-api";
import { cn } from "@/lib/utils";
import type { SearchSeed } from "@/types/recall";
import { ErrorBanner } from "@/components/common/error-banner";

export interface SearchViewProps {
  seed: SearchSeed | null;
  onOpenDocument: (id: number) => void;
}

type SortMode = "relevance" | "name";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Splits the snippet on matched terms (word-boundary, case-insensitive) and wraps hits in <mark>. */
function highlight(snippet: string, terms: string[]): React.ReactNode {
  const escaped = terms
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .map(escapeRegExp);
  if (escaped.length === 0) return snippet;

  let regex: RegExp;
  try {
    regex = new RegExp(`(${escaped.join("|")})`, "gi");
  } catch {
    return snippet;
  }

  return snippet.split(regex).map((part, i) =>
    i % 2 === 1 ? (
      <mark
        key={i}
        className="rounded bg-emerald-400/20 px-0.5 text-emerald-200"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function SearchView({ seed, onOpenDocument }: SearchViewProps) {
  const [input, setInput] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [response, setResponse] = React.useState<SearchResponse | null>(null);
  const [searchedQuery, setSearchedQuery] = React.useState<string | null>(null);
  const [sortBy, setSortBy] = React.useState<SortMode>("relevance");
  const [searchNonce, setSearchNonce] = React.useState(0);

  const runSearch = React.useCallback(async (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    setSearching(true);
    setError(null);
    setSearchedQuery(q);
    try {
      const res = await recallApi.search(q);
      setResponse(res);
    } catch (err) {
      setResponse(null);
      setError(
        err instanceof Error
          ? err.message
          : "Unknown error while searching."
      );
    } finally {
      setSearching(false);
    }
  }, []);

  // Handoff from the global search / quick search: run whenever a new seed arrives.
  React.useEffect(() => {
    if (!seed) return;
    setInput(seed.query);
    void runSearch(seed.query);
  }, [seed, runSearch]);

  // Manual retry from the error banner.
  React.useEffect(() => {
    if (searchNonce === 0) return;
    const q = searchedQuery ?? input;
    if (q.trim()) void runSearch(q);
  }, [searchNonce]);

  const results = response?.results ?? [];
  const maxScore = React.useMemo(
    () => results.reduce((max, r) => Math.max(max, r.score), 0),
    [results]
  );

  const displayed = React.useMemo(() => {
    if (sortBy === "name") {
      return [...results].sort((a, b) =>
        a.documentName.localeCompare(b.documentName)
      );
    }
    return results;
  }, [results, sortBy]);

  const matchedDocuments = React.useMemo(
    () => new Set(results.map((r) => r.documentId)).size,
    [results]
  );

  const submitSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void runSearch(input);
  };

  return (
    <section aria-label="Search" className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-100">
          Search
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Ranked entirely by the custom Java engine — no external service.
        </p>
      </div>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="pt-6">
          <form onSubmit={submitSearch} className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Label htmlFor="search-input" className="sr-only">
                Search terms
              </Label>
              <Input
                id="search-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. insertion sort, recursion, arrays"
                className="min-h-[44px] border-slate-800 bg-slate-950/60 text-sm"
              />
            </div>
            <Button
              type="submit"
              disabled={searching || input.trim().length === 0}
              className="min-h-[44px] bg-emerald-400 text-slate-950 hover:bg-emerald-300"
            >
              {searching ? (
                <span
                  className="size-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950"
                  aria-hidden="true"
                />
              ) : (
                <Search aria-hidden="true" />
              )}
              {searching ? "Searching…" : "Search"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {searching ? (
        <div className="space-y-4">
          <Skeleton className="h-5 w-72 bg-slate-800" />
          <Skeleton className="h-32 w-full bg-slate-800" />
          <Skeleton className="h-32 w-full bg-slate-800" />
        </div>
      ) : null}

      {!searching && error ? (
        <ErrorBanner
          message={error}
          onRetry={() => setSearchNonce((n) => n + 1)}
        />
      ) : null}

      {!searching && !error && response ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-400">
              {results.length} match{results.length === 1 ? "" : "es"} across{" "}
              {matchedDocuments} document{matchedDocuments === 1 ? "" : "s"} in{" "}
              {response.elapsedMs} ms — ranked by the custom Java engine
              (linear scan → relevance score → insertion sort)
            </p>
            <div className="flex items-center gap-2">
              <Label htmlFor="search-sort" className="text-xs text-slate-500">
                Sort
              </Label>
              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy(v as SortMode)}
              >
                <SelectTrigger
                  id="search-sort"
                  size="sm"
                  aria-label="Sort results"
                  title={
                    sortBy === "name"
                      ? "Name sorting is display-only; relevance ranking happens in Java"
                      : undefined
                  }
                  className="min-h-[44px] border-slate-800 bg-slate-950/60 text-xs"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-800 bg-slate-900">
                  <SelectItem value="relevance">Relevance (Java)</SelectItem>
                  <SelectItem value="name">Name (display only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {displayed.length === 0 ? (
            <Card className="border-slate-800 bg-slate-900/50">
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <SearchX className="size-8 text-slate-600" aria-hidden="true" />
                <p className="text-sm font-medium text-slate-300">
                  No documents matched &apos;{response.query}&apos;
                </p>
                <ul className="list-inside list-disc space-y-1 text-left text-xs text-slate-500">
                  <li>Check the spelling of your terms.</li>
                  <li>Try fewer or more general terms.</li>
                  <li>Import more documents from the Documents view.</li>
                </ul>
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-4">
              {displayed.map((r: SearchResult) => (
                <li key={`${r.documentId}-${r.score}`}>
                  <Card className="border-slate-800 bg-slate-900/50 transition-colors hover:border-slate-700">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => onOpenDocument(r.documentId)}
                          className="h-auto min-h-[44px] px-2 text-sm font-medium text-emerald-300 hover:bg-slate-800/60 hover:text-emerald-200"
                        >
                          <FileText className="shrink-0" aria-hidden="true" />
                          <span className="truncate">{r.documentName}</span>
                        </Button>
                        <Badge
                          variant="outline"
                          className="border-emerald-400/30 bg-emerald-400/10 text-[11px] text-emerald-300"
                        >
                          score {r.score.toFixed(4)}
                        </Badge>
                      </div>

                      <div
                        className="h-1 rounded-full bg-slate-800"
                        role="img"
                        aria-label={`Relevance ${r.score.toFixed(4)} out of ${maxScore.toFixed(4)}`}
                      >
                        <div
                          className="h-1 rounded-full bg-emerald-400"
                          style={{
                            width: `${
                              maxScore > 0
                                ? Math.max((r.score / maxScore) * 100, 2)
                                : 2
                            }%`,
                          }}
                        />
                      </div>

                      {r.matchedTerms.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {r.matchedTerms.map((t) => (
                            <Badge
                              key={t}
                              variant="outline"
                              className="border-slate-700 text-[10px] uppercase tracking-wide text-slate-400"
                            >
                              {t}
                            </Badge>
                          ))}
                        </div>
                      ) : null}

                      <p className="text-sm leading-relaxed text-slate-300">
                        {highlight(r.snippet, r.matchedTerms)}
                      </p>

                      <p className="text-xs text-slate-500">
                        {r.wordCount.toLocaleString()} words
                      </p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {!searching && !error && !response ? (
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-slate-100">
              <ListOrdered className="size-4 text-emerald-300" aria-hidden="true" />
              How scoring works
            </CardTitle>
            <CardDescription className="text-slate-400">
              Recall scans every document from start to finish, counts term
              occurrences and normalizes them by document length.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="rounded-lg bg-slate-950/60 p-3 font-mono text-xs text-emerald-200">
              score = matched term occurrences ÷ document words
            </p>
            <ol className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-[11px] font-semibold text-emerald-300">
                  1
                </span>
                Type one or more keywords — order does not matter.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-[11px] font-semibold text-emerald-300">
                  2
                </span>
                Press Search — the Java engine scans and ranks every document.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-[11px] font-semibold text-emerald-300">
                  3
                </span>
                Open any result to preview the full document.
              </li>
            </ol>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
