// Typed API client for the Recall Java backend (Spring Boot on port 8080).
// All requests use relative paths; the sandbox gateway forwards any request
// carrying `?XTransformPort=<port>` to localhost:<port>.

const RAW_BASE =
  process.env.NEXT_PUBLIC_RECALL_API_BASE ||
  (typeof window !== "undefined" && window.location.port === "3000"
    ? "http://localhost:8080/api"
    : "/api");
const BACKEND_PORT = process.env.NEXT_PUBLIC_RECALL_BACKEND_PORT ?? "8080";
const IS_ABSOLUTE = /^(https?:)?\/\//i.test(RAW_BASE);

function endpoint(path: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return IS_ABSOLUTE
    ? `${RAW_BASE}${path}`
    : `${RAW_BASE}${path}${sep}XTransformPort=${BACKEND_PORT}`;
}

export class RecallApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "RecallApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(endpoint(path), {
      cache: "no-store",
      ...init,
    });
  } catch {
    throw new RecallApiError(
      "Cannot reach the Recall backend. Make sure the Java server is running on port 8080."
    );
  }

  if (!response.ok) {
    let message = `Request failed (HTTP ${response.status})`;
    try {
      const body = (await response.json()) as { message?: unknown };
      if (typeof body?.message === "string" && body.message.trim().length > 0) {
        message = body.message;
      }
    } catch {
      // Response body was not JSON — keep the generic HTTP message.
    }
    throw new RecallApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

// ---------------------------------------------------------------------------
// Contract types — field names MUST match the Java backend exactly.
// ---------------------------------------------------------------------------

export interface Health {
  status: string;
  app: string;
  version: string;
  aiConfigured: boolean;
  aiModel: string;
  documentCount: number;
  totalWords: number;
  javaVersion: string;
  dbPath: string;
}

export interface DocumentSummary {
  id: number;
  fileName: string;
  fileType: string;
  wordCount: number;
  importedAt: string;
}

export interface DocumentDetail extends DocumentSummary {
  content: string;
}

export interface DocumentsResponse {
  documents: DocumentSummary[];
}

export interface SearchResult {
  documentId: number;
  documentName: string;
  score: number;
  snippet: string;
  matchedTerms: string[];
  wordCount: number;
}

export interface SearchResponse {
  query: string;
  terms: string[];
  documentsSearched: number;
  elapsedMs: number;
  results: SearchResult[];
}

export interface SourceRef {
  documentId: number;
  documentName: string;
  score: number;
}

export interface AskResponse {
  answer: string;
  sources: SourceRef[];
  model: string;
  usedAi: boolean;
}

export interface SummarizeResponse {
  summary: string;
  documentId: number;
  documentName: string;
  model: string;
  truncated: boolean;
}

export interface DeleteResponse {
  deleted: boolean;
  id: number;
}

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

export const recallApi = {
  health(): Promise<Health> {
    return request<Health>("/health");
  },

  listDocuments(): Promise<DocumentsResponse> {
    return request<DocumentsResponse>("/documents");
  },

  uploadDocument(file: File): Promise<DocumentSummary> {
    // FormData field must be named "file". Do NOT set Content-Type manually —
    // the browser adds the correct multipart boundary header.
    const form = new FormData();
    form.append("file", file);
    return request<DocumentSummary>("/documents", {
      method: "POST",
      body: form,
    });
  },

  getDocument(id: number): Promise<DocumentDetail> {
    return request<DocumentDetail>(`/documents/${id}`);
  },

  deleteDocument(id: number): Promise<DeleteResponse> {
    return request<DeleteResponse>(`/documents/${id}`, { method: "DELETE" });
  },

  search(q: string): Promise<SearchResponse> {
    return request<SearchResponse>(`/search?q=${encodeURIComponent(q)}`);
  },

  ask(question: string): Promise<AskResponse> {
    return request<AskResponse>("/ai/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
  },

  summarize(id: number): Promise<SummarizeResponse> {
    return request<SummarizeResponse>(`/ai/summarize/${id}`, {
      method: "POST",
    });
  },
};
