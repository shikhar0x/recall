"use client";

import * as React from "react";
import {
  Bot,
  FileText,
  Loader2,
  RefreshCw,
  SendHorizontal,
  Sparkles,
  TriangleAlert,
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  recallApi,
  type DocumentSummary,
  type SourceRef,
  type SummarizeResponse,
} from "@/lib/api/recall-api";
import { cn } from "@/lib/utils";
import { ErrorBanner } from "@/components/common/error-banner";
import { MarkdownContent } from "@/components/common/markdown-content";

export interface AssistantViewProps {
  /** null = health unknown yet (backend check in progress). */
  aiConfigured: boolean | null;
  onOpenDocument: (id: number) => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: SourceRef[];
  model?: string;
  usedAi?: boolean;
  isError?: boolean;
  pending?: boolean;
}

let messageIdCounter = 0;
function nextMessageId(): string {
  messageIdCounter += 1;
  return `msg-${messageIdCounter}`;
}

const EXAMPLE_PROMPTS = [
  "What do my notes say about sorting?",
  "Summarize the main ideas in my documents",
];

export function AssistantView({ aiConfigured, onOpenDocument }: AssistantViewProps) {
  // ---- Chat state ----
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement | null>(null);

  // ---- Summarize panel state ----
  const [docs, setDocs] = React.useState<DocumentSummary[] | null>(null);
  const [docsLoading, setDocsLoading] = React.useState(true);
  const [docsError, setDocsError] = React.useState<string | null>(null);
  const [docsNonce, setDocsNonce] = React.useState(0);
  const [selectedId, setSelectedId] = React.useState("");
  const [summary, setSummary] = React.useState<SummarizeResponse | null>(null);
  const [summarizing, setSummarizing] = React.useState(false);
  const [summaryError, setSummaryError] = React.useState<string | null>(null);

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

  // Keep the chat pinned to the newest message.
  React.useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  const send = async () => {
    const question = input.trim();
    if (!question || sending) return;

    setInput("");
    const pendingId = nextMessageId();
    setMessages((prev) => [
      ...prev,
      { id: nextMessageId(), role: "user", text: question },
      { id: pendingId, role: "assistant", text: "", pending: true },
    ]);
    setSending(true);

    try {
      const res = await recallApi.ask(question);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? {
                ...m,
                pending: false,
                text: res.answer,
                sources: res.sources,
                model: res.model,
                usedAi: res.usedAi,
              }
            : m
        )
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? {
                ...m,
                pending: false,
                isError: true,
                text:
                  err instanceof Error
                    ? err.message
                    : "Unknown error while contacting the backend.",
              }
            : m
        )
      );
    } finally {
      setSending(false);
    }
  };

  const summarize = async () => {
    if (!selectedId || summarizing) return;
    setSummarizing(true);
    setSummaryError(null);
    try {
      const res = await recallApi.summarize(Number(selectedId));
      setSummary(res);
    } catch (err) {
      setSummary(null);
      setSummaryError(
        err instanceof Error ? err.message : "Unknown error while summarizing."
      );
    } finally {
      setSummarizing(false);
    }
  };

  const summarizeDisabled =
    aiConfigured !== true || selectedId === "" || summarizing;

  const summarizeTooltip = !aiConfigured
    ? "AI is not configured on the Java backend (GROQ_API_KEY missing)."
    : selectedId === ""
      ? "Choose a document first."
      : "Send the start of this document to Groq for a grounded summary.";

  return (
    <section aria-label="AI Assistant" className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-100">
          AI Assistant
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Ask grounded questions or summarize a document with Groq.
        </p>
      </div>

      <Alert
        className={
          aiConfigured === false
            ? "border-amber-400/30 bg-amber-400/10 text-amber-200 [&>svg]:text-amber-300 *:data-[slot=alert-description]:text-amber-200/80"
            : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200 [&>svg]:text-emerald-300 *:data-[slot=alert-description]:text-emerald-200/80"
        }
      >
        {aiConfigured === false ? (
          <TriangleAlert aria-hidden="true" />
        ) : (
          <Sparkles aria-hidden="true" />
        )}
        <AlertTitle>
          {aiConfigured === false
            ? "AI features are unavailable"
            : aiConfigured === null
              ? "Checking AI configuration…"
              : "Groq AI is ready"}
        </AlertTitle>
        <AlertDescription>
          <p>
            Recall answers questions using Groq AI grounded in your documents.
            Requires internet + GROQ_API_KEY configured on the Java backend.
            When you ask a question, the most relevant passages (not your whole
            library) are sent to Groq.
          </p>
          {aiConfigured === false ? (
            <p>
              AI features are currently unavailable — search and documents keep
              working without it.
            </p>
          ) : null}
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-6 xl:flex-row">
        {/* Chat column */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div
            ref={listRef}
            className="flex max-h-[55vh] min-h-[300px] flex-col gap-3 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/40 p-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-700"
            aria-live="polite"
          >
            {messages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 py-8 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
                  <Bot className="size-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    Ask anything about your documents
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Answers are grounded in the passages Recall retrieves.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {EXAMPLE_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setInput(prompt)}
                      className="min-h-[44px] rounded-full border border-slate-800 bg-slate-900/70 px-4 py-2 text-xs text-slate-300 transition-colors hover:border-emerald-400/40 hover:text-emerald-200"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) =>
                m.role === "user" ? (
                  <div
                    key={m.id}
                    className="max-w-[85%] self-end whitespace-pre-wrap rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-sm text-slate-100"
                  >
                    {m.text}
                  </div>
                ) : m.pending ? (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 self-start rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3"
                    aria-label="Assistant is thinking"
                  >
                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-300" />
                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-300 [animation-delay:150ms]" />
                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-300 [animation-delay:300ms]" />
                  </div>
                ) : (
                  <div
                    key={m.id}
                    className={cn(
                      "max-w-[90%] self-start rounded-2xl border px-4 py-3",
                      m.isError
                        ? "border-red-400/30 bg-red-400/10 text-red-200"
                        : "border-slate-800 bg-slate-900/70 text-slate-200"
                    )}
                  >
                    {m.isError ? (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-red-200">
                        {m.text}
                      </p>
                    ) : (
                      <MarkdownContent content={m.text} />
                    )}

                    {!m.isError && m.usedAi === false ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Answered locally — no relevant documents were found, so
                        nothing was sent to Groq.
                      </p>
                    ) : null}

                    {!m.isError && m.sources && m.sources.length > 0 ? (
                      <div className="mt-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Sources used
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {m.sources.map((s) => (
                            <button
                              key={`${s.documentId}-${s.score}`}
                              type="button"
                              onClick={() => onOpenDocument(s.documentId)}
                              title={`Preview ${s.documentName} (score ${s.score.toFixed(3)})`}
                              className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-emerald-400/40 hover:text-emerald-200"
                            >
                              <FileText
                                className="size-3 shrink-0 text-emerald-300/80"
                                aria-hidden="true"
                              />
                              <span className="max-w-[180px] truncate">
                                {s.documentName}
                              </span>
                              <span className="text-slate-500">
                                {s.score.toFixed(3)}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )
              )
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1">
              <Label htmlFor="assistant-input" className="sr-only">
                Ask a question
              </Label>
              <Textarea
                id="assistant-input"
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder="Ask about your documents… (Enter to send, Shift+Enter for a new line)"
                className="min-h-[44px] resize-none border-slate-800 bg-slate-950/60 text-sm"
              />
            </div>
            <Button
              type="submit"
              disabled={sending || input.trim().length === 0}
              className="min-h-[44px] bg-emerald-400 text-slate-950 hover:bg-emerald-300"
            >
              <SendHorizontal aria-hidden="true" />
              Send
            </Button>
          </form>
        </div>

        {/* Summarize panel */}
        <Card className="w-full shrink-0 self-start border-slate-800 bg-slate-900/50 xl:w-80">
          <CardHeader>
            <CardTitle className="text-base text-slate-100">
              Summarize a document
            </CardTitle>
            <CardDescription className="text-slate-400">
              Groq reads the start of the selected document and returns a
              grounded summary.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {docsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full bg-slate-800" />
                <Skeleton className="h-10 w-full bg-slate-800" />
              </div>
            ) : docsError ? (
              <ErrorBanner
                message={docsError}
                onRetry={() => setDocsNonce((n) => n + 1)}
              />
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="summarize-doc"
                    className="text-xs text-slate-400"
                  >
                    Choose document
                  </Label>
                  <Select
                    value={selectedId}
                    onValueChange={setSelectedId}
                    disabled={!docs || docs.length === 0}
                  >
                    <SelectTrigger
                      id="summarize-doc"
                      aria-label="Choose document to summarize"
                      className="w-full border-slate-800 bg-slate-950/60"
                    >
                      <SelectValue
                        placeholder={
                          !docs || docs.length === 0
                            ? "No documents yet"
                            : "Select a document"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="border-slate-800 bg-slate-900">
                      {docs?.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.fileName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  onClick={() => void summarize()}
                  disabled={summarizeDisabled}
                  title={summarizeTooltip}
                  aria-label="Summarize the selected document with AI"
                  className="min-h-[44px] w-full bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                >
                  {summarizing ? (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Sparkles aria-hidden="true" />
                  )}
                  {summarizing ? "Summarizing…" : "Summarize with AI"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDocsNonce((n) => n + 1)}
                  disabled={docsLoading}
                  aria-label="Refresh document list"
                  className="min-h-[44px] w-full border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:text-slate-100"
                >
                  <RefreshCw aria-hidden="true" />
                  Refresh list
                </Button>
              </>
            )}

            {summaryError ? (
              <Alert className="border-amber-400/30 bg-amber-400/10 text-amber-200 [&>svg]:text-amber-300 *:data-[slot=alert-description]:text-amber-200/80">
                <TriangleAlert aria-hidden="true" />
                <AlertTitle>Summarize failed</AlertTitle>
                <AlertDescription>
                  <p className="break-words">{summaryError}</p>
                </AlertDescription>
              </Alert>
            ) : null}

            {summary ? (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Summary of {summary.documentName}
                </p>
                <div className="max-h-80 overflow-y-auto rounded-lg bg-slate-950/60 p-3.5 text-sm leading-relaxed text-slate-200 border border-slate-800/80 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-700">
                  <MarkdownContent content={summary.summary} />
                </div>
                {summary.truncated ? (
                  <p className="text-[11px] text-amber-300/90">
                    Generated from the first 12,000 characters of the document.
                  </p>
                ) : null}
                <Badge
                  variant="outline"
                  className="border-slate-700 text-[10px] text-slate-400"
                >
                  model: {summary.model}
                </Badge>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
