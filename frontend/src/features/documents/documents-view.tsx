"use client";

import * as React from "react";
import {
  Eye,
  FileText,
  FileX,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { toast } from "@/hooks/use-toast";
import { recallApi, type DocumentSummary } from "@/lib/api/recall-api";
import { cn } from "@/lib/utils";
import { ErrorBanner } from "@/components/common/error-banner";

export interface DocumentsViewProps {
  onOpenDocument: (id: number) => void;
  onLibraryChanged: () => void;
}

const ALLOWED_EXTENSIONS = ["txt", "md", "markdown"];

const SCROLLBAR_CLASSES =
  "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-700";

function fileExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx === -1 ? "" : name.slice(idx + 1).toLowerCase();
}

export function DocumentsView({ onOpenDocument, onLibraryChanged }: DocumentsViewProps) {
  const [docs, setDocs] = React.useState<DocumentSummary[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = React.useState(0);

  const [dragging, setDragging] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [uploadLabel, setUploadLabel] = React.useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = React.useState<DocumentSummary | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await recallApi.listDocuments();
      setDocs(res.documents);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load documents."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, reloadNonce]);

  const handleFiles = async (files: FileList | File[] | null) => {
    if (!files || uploading) return;
    const list = Array.from(files);
    if (list.length === 0) return;

    const valid = list.filter((f) =>
      ALLOWED_EXTENSIONS.includes(fileExtension(f.name))
    );
    const rejected = list.filter(
      (f) => !ALLOWED_EXTENSIONS.includes(fileExtension(f.name))
    );

    if (rejected.length > 0) {
      toast({
        title: "Unsupported file type",
        description: `${rejected
          .map((f) => f.name)
          .join(", ")} — only .txt, .md and .markdown files can be imported.`,
        variant: "destructive",
      });
    }
    if (valid.length === 0) return;

    setUploading(true);
    for (const file of valid) {
      setUploadLabel(file.name);
      try {
        await recallApi.uploadDocument(file);
        toast({
          title: `Imported ${file.name}`,
          description: "The document is now searchable.",
        });
      } catch (err) {
        toast({
          title: `Failed to import ${file.name}`,
          description:
            err instanceof Error ? err.message : "Unknown error while uploading.",
          variant: "destructive",
        });
      }
    }
    setUploading(false);
    setUploadLabel(null);
    await load();
    onLibraryChanged();
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    const target = deleteTarget;
    setDeleting(true);
    try {
      await recallApi.deleteDocument(target.id);
      toast({
        title: `Deleted ${target.fileName}`,
        description: "The document was removed from your library.",
      });
      setDeleteTarget(null);
      await load();
      onLibraryChanged();
    } catch (err) {
      toast({
        title: "Delete failed",
        description:
          err instanceof Error ? err.message : "Unknown error while deleting.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section aria-label="Documents" className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-100">
          Documents
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Import, inspect and remove the files Recall searches.
        </p>
      </div>

      {/* Import zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Import documents: drop .txt or .md files here or press Enter to browse"
        onClick={() => {
          if (!uploading) inputRef.current?.click();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!uploading) inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!uploading) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!uploading) void handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex min-h-[44px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center transition-colors",
          dragging
            ? "border-emerald-400 bg-emerald-400/10"
            : "border-slate-700 bg-slate-900/40 hover:border-emerald-400/60 hover:bg-slate-900/70"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,.markdown,text/plain,text/markdown"
          multiple
          className="hidden"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {uploading ? (
          <>
            <Loader2
              className="size-6 animate-spin text-emerald-300"
              aria-hidden="true"
            />
            <p className="text-sm text-slate-200" aria-live="polite">
              Importing {uploadLabel ?? "file"}…
            </p>
          </>
        ) : (
          <>
            <span className="flex size-11 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
              <Upload className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-200">
                Drag &amp; drop .txt or .md files here
              </p>
              <p className="mt-1 text-xs text-slate-500">
                or click anywhere in this zone to browse — multiple files
                supported
              </p>
            </div>
            <Button
              type="button"
              className="min-h-[44px] bg-emerald-400 text-slate-950 hover:bg-emerald-300"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
            >
              <Upload aria-hidden="true" />
              Choose files
            </Button>
          </>
        )}
      </div>

      {/* Document list */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-base text-slate-100">
            Your library
          </CardTitle>
          <CardDescription className="text-slate-400">
            Every imported document, newest first. Preview or delete each one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full bg-slate-800" />
              <Skeleton className="h-12 w-full bg-slate-800" />
              <Skeleton className="h-12 w-full bg-slate-800" />
            </div>
          ) : error ? (
            <ErrorBanner
              message={error}
              onRetry={() => setReloadNonce((n) => n + 1)}
            />
          ) : !docs || docs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <FileX className="size-8 text-slate-600" aria-hidden="true" />
              <p className="text-sm font-medium text-slate-300">
                No documents yet
              </p>
              <p className="text-xs text-slate-500">
                Import your first .txt or .md file to get started.
              </p>
            </div>
          ) : (
            <ul
              className={cn(
                "max-h-96 divide-y divide-slate-800/70 overflow-y-auto pr-1",
                SCROLLBAR_CLASSES
              )}
            >
              {docs.map((d) => (
                <li
                  key={d.id}
                  className="flex min-h-[52px] items-center gap-3 py-2"
                >
                  <FileText
                    className="size-4 shrink-0 text-emerald-300/80"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-200">{d.fileName}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className="border-slate-700 text-[10px] uppercase tracking-wide text-slate-400"
                      >
                        {d.fileType}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-slate-700 text-[10px] text-slate-400"
                      >
                        {d.wordCount.toLocaleString()} words
                      </Badge>
                      <span className="text-[11px] text-slate-500">
                        {new Date(d.importedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Preview ${d.fileName}`}
                      title={`Preview ${d.fileName}`}
                      onClick={() => onOpenDocument(d.id)}
                      className="size-11 text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                    >
                      <Eye aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${d.fileName}`}
                      title={`Delete ${d.fileName}`}
                      onClick={() => setDeleteTarget(d)}
                      className="size-11 text-slate-400 hover:bg-red-400/10 hover:text-red-300"
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="border-slate-800 bg-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100">
              Delete &apos;{deleteTarget?.fileName}&apos;?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This cannot be undone. The document and its index entries are
              removed from the local database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              className="border-slate-800 bg-transparent text-slate-300 hover:bg-slate-800/60 hover:text-slate-100"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              className="bg-red-400 text-slate-950 hover:bg-red-300"
            >
              {deleting ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
