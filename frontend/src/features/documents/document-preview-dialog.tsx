"use client";

import * as React from "react";
import { FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { recallApi, type DocumentDetail } from "@/lib/api/recall-api";
import { ErrorBanner } from "@/components/common/error-banner";

export interface DocumentPreviewDialogProps {
  documentId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SCROLLBAR_CLASSES =
  "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-700";

/**
 * Shared preview dialog: fetches the full document when opened and renders
 * its raw content in a scrollable monospace block (long lists must scroll).
 */
export function DocumentPreviewDialog({
  documentId,
  open,
  onOpenChange,
}: DocumentPreviewDialogProps) {
  const [doc, setDoc] = React.useState<DocumentDetail | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [retryNonce, setRetryNonce] = React.useState(0);

  React.useEffect(() => {
    if (!open || documentId === null) return;
    let cancelled = false;

    setLoading(true);
    setError(null);
    setDoc(null);

    recallApi
      .getDocument(documentId)
      .then((detail) => {
        if (!cancelled) setDoc(detail);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load the document."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, documentId, retryNonce]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] overflow-y-auto border-slate-800 bg-slate-900 sm:max-w-2xl [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-700"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-6 text-base text-slate-100">
            <FileText className="size-4 shrink-0 text-emerald-300" aria-hidden="true" />
            <span className="truncate">
              {loading ? "Loading document…" : (doc?.fileName ?? "Document")}
            </span>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {doc
              ? `Imported ${new Date(doc.importedAt).toLocaleString()}`
              : "Full document content stored in the local SQLite database."}
          </DialogDescription>
        </DialogHeader>

        {doc ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-slate-700 text-[11px] uppercase tracking-wide text-slate-400"
            >
              {doc.fileType}
            </Badge>
            <Badge
              variant="outline"
              className="border-slate-700 text-[11px] text-slate-400"
            >
              {doc.wordCount.toLocaleString()} words
            </Badge>
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-2" aria-label="Loading document content">
            <Skeleton className="h-4 w-full bg-slate-800" />
            <Skeleton className="h-4 w-11/12 bg-slate-800" />
            <Skeleton className="h-4 w-4/5 bg-slate-800" />
            <Skeleton className="h-4 w-full bg-slate-800" />
            <Skeleton className="h-4 w-2/3 bg-slate-800" />
          </div>
        ) : null}

        {!loading && error ? (
          <ErrorBanner
            message={error}
            onRetry={() => setRetryNonce((n) => n + 1)}
          />
        ) : null}

        {!loading && !error && doc ? (
          <div
            className={`max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-950/60 p-4 font-mono text-sm leading-relaxed text-slate-200 ${SCROLLBAR_CLASSES}`}
          >
            {doc.content}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
